import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, useWindowDimensions, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import PrimaryButton from '@/components/PrimaryButton';
import ProgressIndicator from '@/components/ProgressIndicator';
import { COLORS, SHADOWS, SPACING, SIZES } from '@/constants/theme';
import FadeInView from '@/components/FadeInView';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { saveProfileData, getProfileData } from '@/utils/storage';
import { StatusBar } from 'expo-status-bar';
import { createWorkerProfile, updateWorkerProfile, updateUserProfile } from '@/services/workerService';
import * as Location from 'expo-location';
import { ApiError } from '@/services/apiClient';
import { mapToWorkerProfilePayload } from '@/utils/workerProfileMapper';
import { Briefcase, BedDouble, Utensils, Store, Search, CheckCircle, User, ChefHat } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WorkerProfileSetupScreen() {
  const { t } = useTranslation();
  const researchAndDevelopmentCat = 'Research and Development';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isEducated, setIsEducated] = useState(false);
  const [educationLevel, setEducationLevel] = useState('');
  const [degree, setDegree] = useState('');
  const [college, setCollege] = useState('');

  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [experience, setExperience] = useState('');

  const [isBTModalOpen, setIsBTModalOpen] = useState(false);
  const [btSearch, setBTSearch] = useState('');

  const [languagesKnown, setLanguagesKnown] = useState<string[]>([]);
  const [expectedSalary, setExpectedSalary] = useState<string>('');

  const [selectedJobCategories, setSelectedJobCategories] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const businessTypes = [
    { id: 'Restaurant/Bakery/Bar', label: t('restaurantBakeryBar') || 'Restaurant/Bakery/Bar', icon: Utensils },
    { id: 'Hotel & Accomodation', label: t('hotelAccomodation') || 'Hotel & Accomodation', icon: BedDouble },
    { id: 'Laboratory/R&D', label: t('laboratoryRD') || 'Laboratory / Research & Development', icon: (props: any) => <MaterialCommunityIcons name="microscope" {...props} /> },
    { id: 'Food Processing Industry', label: t('foodProcessingIndustry') || 'Food Processing Industry', icon: (props: any) => <MaterialCommunityIcons name="factory" {...props} /> },
    { id: 'Retail/Distribution', label: t('retailDistribution') || 'Retail/Distribution', icon: Store },
  ];


  useEffect(() => {
    const loadData = async () => {
      const data = await getProfileData();
      if (data) {
        if (data.isEducated) setIsEducated(data.isEducated);
        if (data.businessTypes) setSelectedBusinessTypes(data.businessTypes);
        if (data.selectedExperience && data.selectedExperience.length > 0) setExperience(data.selectedExperience[0]);
        if (data.languagesKnown) setLanguagesKnown(data.languagesKnown);
        if (data.expectedSalary) setExpectedSalary(data.expectedSalary.toString());
        if (data.educationLevel) setEducationLevel(data.educationLevel);
        if (data.degree) setDegree(data.degree);
        if (data.college) setCollege(data.college);
        if (data.selectedJobCategories) setSelectedJobCategories(data.selectedJobCategories);
        if (data.selectedRoles) setSelectedRoles(data.selectedRoles);
      }
    };
    loadData();
  }, []);


  const educationLevels = ['10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'Diploma'];

  const supportedLanguages = [
    { label: 'Tamil', value: 'Tamil' },
    { label: 'English', value: 'English' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Telugu', value: 'Telugu' },
    { label: 'Malayalam', value: 'Malayalam' },
    { label: 'Kannada', value: 'Kannada' },
  ];


  const handleContinue = async () => {
    if (selectedBusinessTypes.length > 0 && languagesKnown.length > 0 && (!isEducated || educationLevel)) {
      const parsedSalary = parseInt(expectedSalary.replace(/[^0-9]/g, ''), 10) || 0;

      await saveProfileData({
        educationLevel,
        degree,
        college,
        education: educationLevel ? `${educationLevel}${degree ? ' - ' + degree : ''}` : '',
        businessTypes: selectedBusinessTypes,
        selectedJobCategories,
        selectedRoles,
        selectedExperience: [experience],
        languagesKnown,
        expectedSalary: parsedSalary,
      });

      setLoading(true);
      setApiError('');
      try {
        // Merge data from earlier onboarding screens (educated-setup) with
        // the fields captured on this screen.
        const stored = await getProfileData();
        let gpsLat: number | undefined;
        let gpsLon: number | undefined;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            gpsLat = pos.coords.latitude;
            gpsLon = pos.coords.longitude;
          }
        } catch { /* permission denied or GPS unavailable */ }

        const payload = mapToWorkerProfilePayload({
          // Identity fields from educated-setup (persisted in AsyncStorage)
          fullName: stored.fullName,
          mobileNumber: stored.mobileNumber,
          email: stored.email,
          // From educated-setup (persisted in AsyncStorage)
          age: stored.age,
          gender: stored.gender,
          address: stored.address,
          isEducated: stored.isEducated ?? isEducated,
          // From this screen
          educationLevel,
          degree,
          college,
          businessTypes: selectedBusinessTypes,
          selectedJobCategories,
          selectedRoles,
          selectedExperience: [experience],
          languagesKnown,
          expectedSalary: parsedSalary,
          liveLatitude: gpsLat,
          liveLongitude: gpsLon,
        });
        try {
          await createWorkerProfile(payload);
        } catch (createErr: any) {
          // If profile already exists (duplicate), fall back to update
          if (createErr instanceof ApiError && (createErr.statusCode === 409 || createErr.statusCode === 500)) {
            await updateWorkerProfile(payload);
          } else {
            throw createErr;
          }
        }
        // Save fullName to the user profile (separate from worker profile)
        if (stored.fullName) {
          try { await updateUserProfile({ fullName: stored.fullName }); } catch (_) {}
        }
        router.push('/worker/jobs-feed');
      } catch (e: any) {
        setApiError(e?.message ?? 'Failed to save profile. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Incomplete Details', 'Please fill in all required fields.');
    }
  };

  const isFormValid = selectedBusinessTypes.length > 0 &&
    selectedJobCategories.length > 0 &&
    selectedRoles.length > 0 &&
    languagesKnown.length > 0 &&
    (!isEducated || educationLevel);

  // Icon Components from job-posting.tsx
  const ManagementIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-tie" size={size} color={color} />;
  const HousekeepingIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="broom" size={size} color={color} />;
  const FrontOfficeIcon = ({ color, size }: { color: string; size: number }) => <Feather name="monitor" size={size} color={color} />;
  const BarIcon = ({ color, size }: { color: string; size: number }) => <Ionicons name="beer-outline" size={size} color={color} />;
  const PastryIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cupcake" size={size} color={color} />;
  const PurchaseIcon = ({ color, size }: { color: string; size: number }) => <Feather name="shopping-bag" size={size} color={color} />;
  const EngineeringIcon = ({ color, size }: { color: string; size: number }) => <Ionicons name="settings-outline" size={size} color={color} />;
  const TraineeIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-school" size={size} color={color} />;
  const ChefHatIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="chef-hat" size={size} color={color} />;
  const PizzaIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="pizza" size={size} color={color} />;
  const CoffeeIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="coffee-outline" size={size} color={color} />;
  const FoodIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="food" size={size} color={color} />;
  const StoveIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="stove" size={size} color={color} />;
  const ToolsIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="tools" size={size} color={color} />;
  const LabIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="flask" size={size} color={color} />;
  const InspectIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="clipboard-check-outline" size={size} color={color} />;
  const RegIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="shield-check-outline" size={size} color={color} />;
  const MeatIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="food-drumstick" size={size} color={color} />;
  const FishIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="fish" size={size} color={color} />;
  const GrainIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="grain" size={size} color={color} />;
  const SnackIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cookie" size={size} color={color} />;
  const FreezerIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="snowflake" size={size} color={color} />;
  const BeverageIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cup" size={size} color={color} />;
  const OilIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="water" size={size} color={color} />;
  const SugarIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cube-outline" size={size} color={color} />;
  const AdditiveIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="flask-outline" size={size} color={color} />;
  const QAManagerIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-tie" size={size} color={color} />;
  const QASupervisorIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-search" size={size} color={color} />;
  const TrayIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="tray-full" size={size} color={color} />;
  const DoorIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="door-open" size={size} color={color} />;
  const DishWasherIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="dishwasher" size={size} color={color} />;
  const BroomIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="broom" size={size} color={color} />;
  const SafetyOfficerIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="shield-check" size={size} color={color} />;
  const PackageIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="package-variant" size={size} color={color} />;
  const LeaderIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-star" size={size} color={color} />;
  const OperatorIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-group" size={size} color={color} />;
  const ProductionIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-cog" size={size} color={color} />;
  const MeatTechIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="tools" size={size} color={color} />;
  const ColdIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="snowflake-thermometer" size={size} color={color} />;
  const MachineHelperIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="robot-industrial" size={size} color={color} />;
  const ShopIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="store" size={size} color={color} />;
  const LineHelperIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-plus" size={size} color={color} />;
  const CuttingCleaningIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="knife" size={size} color={color} />;
  const GenericRoleIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="briefcase-account-outline" size={size} color={color} />;
  const CocktailIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="glass-cocktail" size={size} color={color} />;
  const WineIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="glass-wine" size={size} color={color} />;
  const FemaleIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-tie-woman" size={size} color={color} />;
  const DispatchIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="truck-delivery" size={size} color={color} />;
  const UserIcon = ({ color, size }: { color: string; size: number }) => <User size={size} color={color} />;
  const CashRegisterIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cash-register" size={size} color={color} />;
  const CateringIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="silverware-variant" size={size} color={color} />;
  const RetailIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="storefront-outline" size={size} color={color} />;
  const BoxIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="package-variant-closed" size={size} color={color} />;

  // Category Lists
  const defaultCategoryList = [
    { id: 'Management', label: t('management') },
    { id: 'Kitchen', label: 'Kitchen / Culinary' },
    { id: 'Service', label: 'F&B Service' },
    { id: 'Front Office', label: t('frontOffice') },
    { id: 'Housekeeping', label: t('housekeeping') },
    { id: 'Engineering', label: t('engineeringMaintenance') },
    { id: 'Bar', label: t('barBrewery') },
    { id: 'Bakery', label: t('pastry') },
    { id: 'Store', label: t('purchaseStore') },
    { id: 'Production', label: 'Production / Processing' },
    { id: 'Quality', label: 'Quality / Lab' },
    { id: 'Distribution', label: 'Logistics / Distribution' },
  ];

  const foodProcessingCategoryList = [
    { id: 'Management', label: t('management') || 'Management' },
    { id: 'Production / Manufacturing', label: 'Production / Manufacturing' },
    { id: 'Packing', label: 'Packing' },
    { id: 'Quality Control', label: 'Quality Control' },
    { id: 'Maintenance & Engineering', label: 'Maintenance & Engineering' },
    { id: 'Sanitisation', label: 'Sanitisation' },
    { id: 'Research and Development', label: 'Research and Development' },
    { id: 'Food Safety & Food Science', label: 'Food Safety & Food Science' },
    { id: 'Executive / Hotel Leadership', label: 'Executive / Hotel Leadership' },
    { id: 'Front Office Management', label: 'Front Office Management' },
    { id: 'Food & Beverage Management', label: 'Food & Beverage Management' },
    { id: 'Bell Service / Room Attendant', label: 'Bell Service / Room Attendant' },
    { id: 'Housekeeping Management/Laundry', label: 'Housekeeping Management/Laundry' },
    { id: 'Kitchen / Bar Staff', label: 'Kitchen / Bar Staff' },
    { id: 'Service Staff', label: 'Service Staff' },
    { id: 'Sales & Marketing / Digital Sales', label: 'Sales & Marketing / Digital Sales' },
    { id: 'Security & Maintenance', label: 'Security & Maintenance' },
    { id: 'Admin / HR / Finance / Purchase', label: 'Admin / HR / Finance / Purchase' },
    { id: 'IT', label: 'IT' },
    { id: 'Product Development', label: 'Product Development' },
    { id: 'Research & Laboratory', label: 'Research & Laboratory' },
    { id: 'Food Safety & Quality Assurance', label: 'Food Safety & Quality Assurance' },
    { id: 'Education & Consultant', label: 'Education & Consultant' },
    { id: 'Compliances', label: 'Compliances' },
    { id: 'IT & Photography', label: 'IT & Photography' },
    { id: 'Admin / Accountant', label: 'Admin / Accountant' },
    { id: 'Purchase / Store', label: 'Purchase / Store' },
    { id: 'Kitchen / Operation', label: 'Kitchen / Operation' },
    { id: 'Cleaning / Maintenance', label: 'Cleaning / Maintenance' },
    { id: 'Procurement / Purchase', label: 'Procurement / Purchase' },
    { id: 'Warehouse / Inventory', label: 'Warehouse / Inventory' },
    { id: 'Logistics and supply chain', label: 'Logistics and supply chain' },
    { id: 'Customer service and Sales', label: 'Customer service and Sales' },
    { id: 'Ecommerce & Digital', label: 'Ecommerce & Digital' },
    { id: 'Accounts', label: 'Accounts' },
  ];

  const hotelCategoryList = [
    { id: 'Executive / Hotel Leadership', label: t('executiveLeadership') || 'Executive / Hotel Leadership' },
    { id: 'Front Office Management', label: 'Front Office Management' },
    { id: 'Food & Beverage Management', label: 'Food & Beverage Management' },
    { id: 'Bell service/ Room Attendant', label: 'Bell service/ Room Attendant' },
    { id: 'Housekeeping Management/ Laundry', label: 'Housekeeping Management/ Laundry' },
    { id: 'Kitchen/Bar Staff', label: 'Kitchen/Bar Staff' },
    { id: 'Service Staff', label: t('serviceStaff') || 'Service Staff' },
    { id: 'Sales & Marketing / Digital Sales', label: 'Sales & Marketing / Digital Sales' },
    { id: 'Security & Maintanance', label: 'Security & Maintanance' },
    { id: 'Admin/ HR/ Finance/Purchase', label: 'Admin/ HR/ Finance/Purchase' },
    { id: 'IT', label: 'IT' },
  ];

  const labRdCategoryList = [
    { id: 'Management', label: t('management') || 'Management' },
    { id: 'Product Development', label: 'Product Development' },
    { id: 'Research & Laboratory', label: 'Research & Laboratory' },
    { id: 'Food Safety & Quality Assurance', label: 'Food Safety & Quality Assurance' },
    { id: 'Education & Consultant', label: 'Education & Consultant' },
    { id: 'Compliances', label: 'Compliances' },
    { id: 'Nutritionist', label: 'Nutritionist' },
    { id: 'IT & Photography', label: 'IT & Photography' },
  ];

  const restaurantCategoryList = [
    { id: 'Management', label: t('management') || 'Management' },
    { id: 'Admin / Accountant', label: 'Admin / Accountant' },
    { id: 'Purchase / Store', label: 'Purchase / Store' },
    { id: 'Kitchen / Operation', label: 'Kitchen / Operation' },
    { id: 'Cleaning / Maintenance', label: 'Cleaning / Maintenance' },
  ];

  const retailCategoryList = [
    { id: 'Management', label: t('management') || 'Management' },
    { id: 'Procurement/Purchase', label: 'Procurement/Purchase' },
    { id: 'Warehouse/Inventory', label: 'Warehouse/Inventory' },
    { id: 'Logistics and supply chain', label: 'Logistics and supply chain' },
    { id: 'Customer service and Sales', label: 'Customer service and Sales' },
    { id: 'E-Commerce & Digital', label: 'E-commerce & Digital' },
    { id: 'Compliance', label: 'Compliance' },
    { id: 'Quality', label: 'Quality' },
    { id: 'Accounts', label: 'Accounts' },
  ];

  const isHotelAndAccomodation = selectedBusinessTypes.includes('Hotel & Accomodation');
  const isFoodProcessingIndustry = selectedBusinessTypes.includes('Food Processing Industry');
  const isLaboratoryRD = selectedBusinessTypes.includes('Laboratory/R&D');
  const isRestaurantBakeryBar = selectedBusinessTypes.includes('Restaurant/Bakery/Bar');
  const isRetailDistribution = selectedBusinessTypes.includes('Retail/Distribution');

  const categoryList = isFoodProcessingIndustry
    ? foodProcessingCategoryList
    : isHotelAndAccomodation
      ? hotelCategoryList
      : isLaboratoryRD
        ? labRdCategoryList
        : isRestaurantBakeryBar
          ? restaurantCategoryList
          : isRetailDistribution
            ? retailCategoryList
            : defaultCategoryList;

  // I'll skip the full roles definitions here and use a helper to get them 
  // to avoid making the multi_replace too large. I'll define a few for context.
  // Actually, I should probably include them since they were asked for.
  // I will define the role retrieval logic.

  const restaurantManagementRoles = [
    { id: 'Restaurant Manager RBB', label: 'Restaurant Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Bar Manager RBB', label: 'Bar Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'FB Manager RBB', label: 'F&B Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Outlet Manager RBB', label: 'Outlet Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Banquet Manager RBB', label: 'Banquet Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'HR Manager RBB', label: 'Human Resource Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Supervisor RBB', label: 'Supervisor', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Kitchen Manager RBB', label: 'Kitchen Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Catering Manager RBB', label: 'Catering Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Event Coordinator RBB', label: 'Event Coordinator', icon: LineHelperIcon, cat: 'Management' },
    { id: 'Purchase Manager RBB', label: 'Purchase Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Store Manager RBB', label: 'Store Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Cost Controller RBB', label: 'Cost Controller', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Store Incharge RBB', label: 'Store Incharge', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Front Desk RBB', label: 'Front Desk', icon: FrontOfficeIcon, cat: 'Management' },
    { id: 'Asst Manager RBB', label: 'Asst Manager', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Housekeeping Manager RBB', label: 'Housekeeping Manager', icon: HousekeepingIcon, cat: 'Management' },
    { id: 'Cleaning Supervisor RBB', label: 'Cleaning Supervisor', icon: BroomIcon, cat: 'Management' },
    { id: 'Chief Accountant RBB', label: 'Chief Accountant', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Accounting Manager RBB', label: 'Accounting Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Parcel Supervisor RBB', label: 'Parcel Supervisor', icon: QASupervisorIcon, cat: 'Management' },
  ];

  const restaurantAdminAccountantRoles = [
    { id: 'Cashier RBB', label: 'Cashier', icon: CashRegisterIcon, cat: 'Admin / Accountant' },
    { id: 'Billing RBB', label: 'Billing', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Admin Assistant RBB', label: 'Admin Assistant', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Receptionist RBB', label: 'Receptionist', icon: FrontOfficeIcon, cat: 'Admin / Accountant' },
    { id: 'HR Assistant RBB', label: 'HR Assistant', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Clerk RBB', label: 'Clerk', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Data Entry RBB', label: 'Data Entry', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Store Assistant RBB', label: 'Store Assistant', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Purchase Assistant RBB', label: 'Purchase Assistant', icon: LineHelperIcon, cat: 'Admin / Accountant' },
  ];

  const restaurantPurchaseStoreRoles = [
    { id: 'Service Waiter PS RBB', label: 'Service/Waiter', icon: TrayIcon, cat: 'Purchase / Store' },
    { id: 'Food Runner PS RBB', label: 'Food Runner', icon: FoodIcon, cat: 'Purchase / Store' },
    { id: 'Captain PS RBB', label: 'Captain', icon: QASupervisorIcon, cat: 'Purchase / Store' },
    { id: 'Bar Tender PS RBB', label: 'Bar Tender', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Bar Back PS RBB', label: 'Bar Back', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Sommelier Wine Steward PS RBB', label: 'Sommelier/Wine Steward', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Mixologist PS RBB', label: 'Mixologist', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Barista PS RBB', label: 'Barista', icon: CoffeeIcon, cat: 'Purchase / Store' },
    { id: 'Greeter PS RBB', label: 'Greeter', icon: LineHelperIcon, cat: 'Purchase / Store' },
    { id: 'Reservationist PS RBB', label: 'Reservationist', icon: LineHelperIcon, cat: 'Purchase / Store' },
    { id: 'Counter Parcel PS RBB', label: 'Counter/Parcel', icon: LineHelperIcon, cat: 'Purchase / Store' },
    { id: 'Buffet Attendant PS RBB', label: 'Buffet Attendant', icon: TrayIcon, cat: 'Purchase / Store' },
    { id: 'Event Planner PS RBB', label: 'Event Planner', icon: LineHelperIcon, cat: 'Purchase / Store' },
  ];

  const restaurantKitchenOperationRoles = [
    { id: 'Executive Chef KO RBB', label: 'Executive Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Corporate Chef KO RBB', label: 'Corporate Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Sous Chef KO RBB', label: 'Sous Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Culinary Director KO RBB', label: 'Culinary Director', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: "Maitre d KO RBB", label: "Maitre'd", icon: QAManagerIcon, cat: 'Kitchen / Operation' },
    { id: 'Chef de Cuisine KO RBB', label: 'Chef de Cuisine', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Commis 1 KO RBB', label: 'Commis 1', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Commis 2 KO RBB', label: 'Commis 2', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Commis 3 KO RBB', label: 'Commis 3', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Line Cook KO RBB', label: 'Line Cook', icon: StoveIcon, cat: 'Kitchen / Operation' },
    { id: 'Fry Cook KO RBB', label: 'Fry Cook', icon: StoveIcon, cat: 'Kitchen / Operation' },
    { id: 'Pantry Cook KO RBB', label: 'Pantry Cook', icon: StoveIcon, cat: 'Kitchen / Operation' },
    { id: 'Pantry Chef KO RBB', label: 'Pantry Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Pizza Chef KO RBB', label: 'Pizza Chef', icon: PizzaIcon, cat: 'Kitchen / Operation' },
    { id: 'Sushi Chef KO RBB', label: 'Sushi Chef', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Kitchen Assistant KO RBB', label: 'Kitchen Assistant', icon: LineHelperIcon, cat: 'Kitchen / Operation' },
    { id: 'Vegetable Cutter KO RBB', label: 'Vegetable Cutter', icon: CuttingCleaningIcon, cat: 'Kitchen / Operation' },
    { id: 'Kitchen Porter KO RBB', label: 'Kitchen Porter', icon: LineHelperIcon, cat: 'Kitchen / Operation' },
    { id: 'Banquet Chef KO RBB', label: 'Banquet Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Chinese Master KO RBB', label: 'Chinese Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Tandoori Grill Chef KO RBB', label: 'Tandoori/Grill Chef', icon: StoveIcon, cat: 'Kitchen / Operation' },
    { id: 'South Indian Cook KO RBB', label: 'South Indian Cook', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'North Indian Cook KO RBB', label: 'North Indian Cook', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Continental Cook KO RBB', label: 'Continental Cook', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Recipe Tester KO RBB', label: 'Recipe Tester', icon: LabIcon, cat: 'Kitchen / Operation' },
    { id: 'Sweet Master KO RBB', label: 'Sweet Master', icon: PastryIcon, cat: 'Kitchen / Operation' },
    { id: 'Savouries Master KO RBB', label: 'Savouries Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Bakery Master KO RBB', label: 'Bakery Master', icon: PastryIcon, cat: 'Kitchen / Operation' },
    { id: 'Chocolate Artist KO RBB', label: 'Chocolate Artist', icon: PastryIcon, cat: 'Kitchen / Operation' },
    { id: 'Tea Master KO RBB', label: 'Tea Master', icon: CoffeeIcon, cat: 'Kitchen / Operation' },
    { id: 'Juice Master KO RBB', label: 'Juice Master', icon: CoffeeIcon, cat: 'Kitchen / Operation' },
    { id: 'Vada Bujji Bonda Master KO RBB', label: 'Vada/Bujji/Bonda Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Chat Master KO RBB', label: 'Chat Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Dosa Parotta Master KO RBB', label: 'Dosa/Parotta Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Kitchen Helper KO RBB', label: 'Kitchen Helper', icon: LineHelperIcon, cat: 'Kitchen / Operation' },
  ];

  const restaurantCleaningMaintenanceRoles = [
    { id: 'Dishwashing CM RBB', label: 'Dish Washing', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'Kitchen Cleaning CM RBB', label: 'Kitchen Cleaning', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'RestRoom Cleaning CM RBB', label: 'RestRoom Cleaning', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'Electrician Plumber CM RBB', label: 'Electrician/Plumber', icon: ToolsIcon, cat: 'Cleaning / Maintenance' },
  ];

  const retailManagementRoles = [
    { id: 'Warehouse Manager RD', label: 'Warehouse Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Operations Manager RD', label: 'Operations Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Shift Supervisor RD', label: 'Shift Supervisor', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Store Manager RD', label: 'Store Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Assistant Store Manager RD', label: 'Assistant Store Manager', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Department Manager RD', label: 'Department Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Supplier Relations Manager RD', label: 'Supplier Relations Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Procurement Manager RD', label: 'Procurement Manager', icon: QAManagerIcon, cat: 'Management' },
  ];

  const retailProcurementRoles = [
    { id: 'Buyer Purchasing Agent RD', label: 'Buyer Purchasing Agent', icon: LineHelperIcon, cat: 'Procurement/Purchase' },
    { id: 'Sourcing Specialist RD', label: 'Sourcing Specialist', icon: LineHelperIcon, cat: 'Procurement/Purchase' },
    { id: 'Vendor Coordinator RD', label: 'Vendor Coordinator', icon: LineHelperIcon, cat: 'Procurement/Purchase' },
    { id: 'Frozen Food Specialist RD', label: 'Frozen Food Specialist', icon: FreezerIcon, cat: 'Procurement/Purchase' },
  ];

  const retailWarehouseInventoryRoles = [
    { id: 'Forklift Operator RD', label: 'Forklift Operator', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Order Picker RD', label: 'Order Picker', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Palletizer RD', label: 'Palletizer', icon: PackageIcon, cat: 'Warehouse/Inventory' },
    { id: 'Reach Truck Operator RD', label: 'Reach Truck Operator', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Receiver RD', label: 'Receiver', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Dock Worker RD', label: 'Dock Worker', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Unloader RD', label: 'Unloader', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Checker RD', label: 'Checker', icon: QASupervisorIcon, cat: 'Warehouse/Inventory' },
    { id: 'Shipper RD', label: 'Shipper', icon: PackageIcon, cat: 'Warehouse/Inventory' },
    { id: 'Loader RD', label: 'Loader', icon: PackageIcon, cat: 'Warehouse/Inventory' },
    { id: 'Dispatch Coordinator RD', label: 'Dispatch Coordinator', icon: QAManagerIcon, cat: 'Warehouse/Inventory' },
    { id: 'Inventory Clerk RD', label: 'Inventory Clerk', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Cycle Counter RD', label: 'Cycle Counter', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Stock Keeper RD', label: 'Stock Keeper', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
  ];

  const retailLogisticsRoles = [
    { id: 'Truck Driver CDL RD', label: 'Truck Driver (CDL)', icon: PackageIcon, cat: 'Logistics and supply chain' },
    { id: 'Delivery Driver RD', label: 'Delivery Driver', icon: PackageIcon, cat: 'Logistics and supply chain' },
    { id: 'Route Driver RD', label: 'Route Driver', icon: PackageIcon, cat: 'Logistics and supply chain' },
    { id: 'Box Truck Driver RD', label: 'Box Truck Driver', icon: PackageIcon, cat: 'Logistics and supply chain' },
    { id: 'Fleet Manager RD', label: 'Fleet Manager', icon: QAManagerIcon, cat: 'Logistics and supply chain' },
    { id: 'Dispatcher RD', label: 'Dispatcher', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Route Planner RD', label: 'Route Planner', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Fleet Maintenance Supervisor RD', label: 'Fleet Maintenance Supervisor', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Refrigeration Technician RD', label: 'Refrigeration Technician', icon: ToolsIcon, cat: 'Logistics and supply chain' },
    { id: 'Temperature Monitor RD', label: 'Temperature Monitor', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Cold Room Supervisor RD', label: 'Cold Room Supervisor', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Logistics Coordinator RD', label: 'Logistics Coordinator', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Traffic Manager RD', label: 'Traffic Manager', icon: QAManagerIcon, cat: 'Logistics and supply chain' },
    { id: 'Freight Broker RD', label: 'Freight Broker', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Import Export Coordinator RD', label: 'Import/Export Coordinator', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Supply Chain Planner RD', label: 'Supply Chain Planner', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Demand Planner RD', label: 'Demand Planner', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Replenishment Analyst RD', label: 'Replenishment Analyst', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
  ];

  const retailCustomerServiceRoles = [
    { id: 'Sales Associate RD', label: 'Sales Associate', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Stock Clerk RD', label: 'Stock Clerk', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Shelf Stocker RD', label: 'Shelf Stocker', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Merchandiser RD', label: 'Merchandiser', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Customer Service Representative RD', label: 'Customer Service Representative', icon: FrontOfficeIcon, cat: 'Customer service and Sales' },
    { id: 'Greeter RD', label: 'Greeter', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Information Desk Clerk RD', label: 'Information Desk Clerk', icon: LineHelperIcon, cat: 'Customer service and Sales' },
  ];

  const retailEcommerceRoles = [
    { id: 'Ecommerce Manager RD', label: 'E-commerce Manager', icon: QAManagerIcon, cat: 'E-Commerce & Digital' },
    { id: 'Online Order Picker RD', label: 'Online Order Picker', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Curbside Attendant RD', label: 'Curbside Attendant', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Personal Shopper RD', label: 'Personal Shopper', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Online Merchandiser RD', label: 'Online Merchandiser', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Product Lister RD', label: 'Product Lister', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Content Creator RD', label: 'Content Creator', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
  ];

  const retailComplianceRoles = [
    { id: 'Trade Compliance Specialist RD', label: 'Trade Compliance Specialist', icon: RegIcon, cat: 'Compliance' },
    { id: 'Customs Broker RD', label: 'Customs Broker', icon: RegIcon, cat: 'Compliance' },
  ];

  const retailQualityRoles = [
    { id: 'Food Safety Auditor RD', label: 'Food Safety Auditor', icon: SafetyOfficerIcon, cat: 'Quality' },
    { id: 'Quality Inspector RD', label: 'Quality Inspector', icon: QASupervisorIcon, cat: 'Quality' },
  ];

  const retailAccountsRoles = [
    { id: 'Cashier RD', label: 'Cashier', icon: CashRegisterIcon, cat: 'Accounts' },
    { id: 'Accountant RD', label: 'Accountant', icon: QAManagerIcon, cat: 'Accounts' },
  ];

  const hotelAndAccomodationRoles = [
    // Executive / Hotel Leadership
    { id: 'Chief Executive Officer (CEO)', label: 'Chief Executive Officer (CEO)', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Operating Officer (COO)', label: 'Chief Operating Officer (COO)', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Financial Officer (CFO)', label: 'Chief Financial Officer (CFO)', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Marketing Officer (CMO)', label: 'Chief Marketing Officer (CMO)', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Revenue Officer', label: 'Chief Revenue Officer', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Regional Director', label: 'Regional Director', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Area General Manager', label: 'Area General Manager', icon: QASupervisorIcon, cat: 'Executive / Hotel Leadership' },

    // Front Office Management
    { id: 'Front Office Manager', label: 'Front Office Manager', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Assistant Front Office Manager', label: 'Assistant Front Office Manager', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Guest Relations Manager', label: 'Guest Relations Manager', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Night Manager', label: 'Night Manager', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Front Desk Supervisor', label: 'Front Desk Supervisor', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Front Desk Agent', label: 'Front Desk Agent', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Guest Service Agent', label: 'Guest Service Agent', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Receptionist', label: 'Receptionist', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Night Auditor', label: 'Night Auditor', icon: FrontOfficeIcon, cat: 'Front Office Management' },


    // Bell service/ Room Attendant
    { id: 'Bell Captain', label: 'Bell Captain', icon: LineHelperIcon, cat: 'Bell service/ Room Attendant' },
    { id: 'Bell Attendant', label: 'Bell Attendant', icon: LineHelperIcon, cat: 'Bell service/ Room Attendant' },
    { id: 'Bellman', label: 'Bellman', icon: LineHelperIcon, cat: 'Bell service/ Room Attendant' },
    { id: 'Doorman', label: 'Doorman', icon: DoorIcon, cat: 'Bell service/ Room Attendant' },
    { id: 'Luggage Porter', label: 'Luggage Porter', icon: LineHelperIcon, cat: 'Bell service/ Room Attendant' },
    { id: 'Valet Parking Attendant', label: 'Valet Parking Attendant', icon: LineHelperIcon, cat: 'Bell service/ Room Attendant' },

    // Housekeeping Management/ Laundry
    { id: 'Executive Housekeeper', label: 'Executive Housekeeper', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Assistant Executive Housekeeper', label: 'Assistant Executive Housekeeper', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Housekeeping Manager', label: 'Housekeeping Manager', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Laundry Manager', label: 'Laundry Manager', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Housekeeping Supervisor', label: 'Housekeeping Supervisor', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Floor Supervisor', label: 'Floor Supervisor', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Public Area Supervisor', label: 'Public Area Supervisor', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Linen Room Supervisor', label: 'Linen Room Supervisor', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Room Attendant', label: 'Room Attendant', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Houseman', label: 'Houseman', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Turndown Attendant', label: 'Turndown Attendant', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Laundry Attendant', label: 'Laundry Attendant', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Laundry Worker', label: 'Laundry Worker', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Valet Runner', label: 'Valet Runner', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Dry Cleaner', label: 'Dry Cleaner', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Seamstress/Tailor', label: 'Seamstress/Tailor', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },
    { id: 'Assistant Housekeeper', label: 'Assistant Housekeeper', icon: HousekeepingIcon, cat: 'Housekeeping Management/ Laundry' },

    // Food & Beverage Management
    { id: 'Banquet catering Hotel', label: 'Banquet catering', icon: CateringIcon, cat: 'Food & Beverage Management' },
    { id: 'Director of Food & Beverage Hotel', label: 'Director of Food & Beverage', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Assistant Director of Food & Beverage Hotel', label: 'Assistant Director of Food & Beverage', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'F&B Manager Hotel', label: 'F&B Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Outlet Manager Hotel', label: 'Outlet Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Manager Hotel', label: 'Banquet Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Room Service Manager Hotel', label: 'Room Service Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Catering Manager Hotel', label: 'Catering Manager', icon: CateringIcon, cat: 'Food & Beverage Management' },
    { id: 'Bar Manager Hotel', label: 'Bar Manager', icon: BarIcon, cat: 'Food & Beverage Management' },
    { id: 'Beverage Director Hotel', label: 'Beverage Director', icon: BarIcon, cat: 'Food & Beverage Management' },
    { id: 'Restaurant Manager Hotel', label: 'Restaurant Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'F&B Supervisor Hotel', label: 'F&B Supervisor', icon: QASupervisorIcon, cat: 'Food & Beverage Management' },
    { id: 'Head Server Hotel', label: 'Head Server', icon: TrayIcon, cat: 'Food & Beverage Management' },
    { id: 'Head Bartender Hotel', label: 'Head Bartender', icon: BarIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Captain Hotel', label: 'Banquet Captain', icon: QASupervisorIcon, cat: 'Food & Beverage Management' },
    { id: 'Room Service Supervisor Hotel', label: 'Room Service Supervisor', icon: QASupervisorIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Setup Attendant Hotel', label: 'Banquet Setup Attendant', icon: LineHelperIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Houseman Hotel', label: 'Banquet Houseman', icon: LineHelperIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Porter Hotel', label: 'Banquet Porter', icon: LineHelperIcon, cat: 'Food & Beverage Management' },
    { id: 'Catering Coordinator Hotel', label: 'Catering Coordinator', icon: CateringIcon, cat: 'Food & Beverage Management' },
    { id: 'Catering Sales Manager Hotel', label: 'Catering Sales Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Event Planner Hotel', label: 'Event Planner', icon: QAManagerIcon, cat: 'Food & Beverage Management' },

    // Kitchen/Bar Staff
    { id: 'Executive Chef', label: 'Executive Chef', icon: ChefHatIcon, cat: 'Kitchen/Bar Staff' },
    { id: 'Sous Chef', label: 'Sous Chef', icon: ChefHatIcon, cat: 'Kitchen/Bar Staff' },
    { id: 'Chef de Partie', label: 'Chef de Partie', icon: ChefHatIcon, cat: 'Kitchen/Bar Staff' },
    { id: 'Line Cook', label: 'Line Cook', icon: StoveIcon, cat: 'Kitchen/Bar Staff' },
    { id: 'Prep Cook', label: 'Prep Cook', icon: StoveIcon, cat: 'Kitchen/Bar Staff' },
    { id: 'Pastry Chef', label: 'Pastry Chef', icon: PastryIcon, cat: 'Kitchen/Bar Staff' },
    { id: 'Banquet Chef', label: 'Banquet Chef', icon: ChefHatIcon, cat: 'Kitchen/Bar Staff' },
    { id: 'Kitchen Steward', label: 'Kitchen Steward', icon: DishWasherIcon, cat: 'Kitchen/Bar Staff' },
    { id: 'Dishwasher', label: 'Dishwasher', icon: DishWasherIcon, cat: 'Kitchen/Bar Staff' },

    // Service Staff
    { id: 'Server/Waiter Hotel SS', label: 'Server/Waiter', icon: TrayIcon, cat: 'Service Staff' },
    { id: 'Banquet Server Hotel SS', label: 'Banquet Server', icon: TrayIcon, cat: 'Service Staff' },
    { id: 'Cocktail Server Hotel SS', label: 'Cocktail Server', icon: CocktailIcon, cat: 'Service Staff' },
    { id: 'Busser Hotel SS', label: 'Busser', icon: TrayIcon, cat: 'Service Staff' },
    { id: 'Food Runner Hotel SS', label: 'Food Runner', icon: FoodIcon, cat: 'Service Staff' },
    { id: 'Room Service Attendant Hotel SS', label: 'Room Service Attendant', icon: TrayIcon, cat: 'Service Staff' },
    { id: 'In-Room Dining Server Hotel SS', label: 'In-Room Dining Server', icon: TrayIcon, cat: 'Service Staff' },
    { id: 'Bartender Hotel SS', label: 'Bartender', icon: BarIcon, cat: 'Service Staff' },
    { id: 'Barback Hotel SS', label: 'Barback', icon: BarIcon, cat: 'Service Staff' },
    { id: 'Sommelier Hotel SS', label: 'Sommelier', icon: WineIcon, cat: 'Service Staff' },
    { id: 'Barista Hotel SS', label: 'Barista', icon: CoffeeIcon, cat: 'Service Staff' },
    { id: 'Cocktail Mixologist Hotel SS', label: 'Cocktail Mixologist', icon: CocktailIcon, cat: 'Service Staff' },
    { id: 'Host/Hostess Hotel SS', label: 'Host/Hostess', icon: LineHelperIcon, cat: 'Service Staff' },
    { id: 'Greeter Hotel SS', label: 'Greeter', icon: LineHelperIcon, cat: 'Service Staff' },
    { id: 'Banquet Setup Attendant Hotel SS', label: 'Banquet Setup Attendant', icon: LineHelperIcon, cat: 'Service Staff' },
    { id: 'Banquet Houseman Hotel SS', label: 'Banquet Houseman', icon: LineHelperIcon, cat: 'Service Staff' },
    { id: 'Banquet Porter Hotel SS', label: 'Banquet Porter', icon: LineHelperIcon, cat: 'Service Staff' },

    // Sales & Marketing / Digital Sales
    { id: 'Director of Sales & Marketing', label: 'Director of Sales & Marketing', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Sales', label: 'Director of Sales', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Marketing', label: 'Director of Marketing', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Revenue Management', label: 'Director of Revenue Management', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Manager', label: 'Sales Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Marketing Manager', label: 'Marketing Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Digital Marketing Manager', label: 'Digital Marketing Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Social Media Manager', label: 'Social Media Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Communications Manager', label: 'Communications Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Brand Manager', label: 'Brand Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Executive', label: 'Sales Executive', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Corporate Sales Manager', label: 'Corporate Sales Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Leisure Sales Manager', label: 'Leisure Sales Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Group Sales Manager', label: 'Group Sales Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Wedding Sales Manager', label: 'Wedding Sales Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Conference Sales Manager', label: 'Conference Sales Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Coordinator', label: 'Sales Coordinator', icon: LineHelperIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Catering Sales Manager SM', label: 'Catering Sales Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Marketing Coordinator', label: 'Marketing Coordinator', icon: LineHelperIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Content Creator', label: 'Content Creator', icon: LineHelperIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Graphic Designer', label: 'Graphic Designer', icon: LineHelperIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Public Relations Manager', label: 'Public Relations Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'SEO Specialist', label: 'SEO Specialist', icon: LineHelperIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'E-commerce Manager', label: 'E-commerce Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Website Manager', label: 'Website Manager', icon: LineHelperIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Online Reputation Manager', label: 'Online Reputation Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },

    // Security & Maintanance
    { id: 'Maintenance Manager', label: 'Maintenance Manager', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Engineering Supervisor', label: 'Engineering Supervisor', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Maintenance Technician', label: 'Maintenance Technician', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'General Maintenance', label: 'General Maintenance', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'HVAC Technician', label: 'HVAC Technician', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Electrician', label: 'Electrician', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Plumber', label: 'Plumber', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Carpenter', label: 'Carpenter', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Painter', label: 'Painter', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Pool Maintenance Technician', label: 'Pool Maintenance Technician', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Refrigeration Technician', label: 'Refrigeration Technician', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Handyman', label: 'Handyman', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Landscaper', label: 'Landscaper', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Groundskeeper', label: 'Groundskeeper', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Gardener', label: 'Gardener', icon: EngineeringIcon, cat: 'Security & Maintanance' },
    { id: 'Director of Security', label: 'Director of Security', icon: SafetyOfficerIcon, cat: 'Security & Maintanance' },
    { id: 'Security Manager', label: 'Security Manager', icon: SafetyOfficerIcon, cat: 'Security & Maintanance' },
    { id: 'Security Supervisor', label: 'Security Supervisor', icon: SafetyOfficerIcon, cat: 'Security & Maintanance' },
    { id: 'Security Officer', label: 'Security Officer', icon: SafetyOfficerIcon, cat: 'Security & Maintanance' },
    { id: 'Patrol Officer', label: 'Patrol Officer', icon: SafetyOfficerIcon, cat: 'Security & Maintanance' },
    { id: 'Loss Prevention Officer', label: 'Loss Prevention Officer', icon: SafetyOfficerIcon, cat: 'Security & Maintanance' },
    { id: 'CCTV Operator', label: 'CCTV Operator', icon: SafetyOfficerIcon, cat: 'Security & Maintanance' },
    { id: 'Night Security Guard', label: 'Night Security Guard', icon: SafetyOfficerIcon, cat: 'Security & Maintanance' },

    // Admin/ HR/ Finance/Purchase
    { id: 'Director of Human Resources', label: 'Director of Human Resources', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'HR Manager', label: 'HR Manager', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Talent Acquisition Manager', label: 'Talent Acquisition Manager', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Training Manager', label: 'Training Manager', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Recruiter', label: 'Recruiter', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Talent Acquisition Specialist', label: 'Talent Acquisition Specialist', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'HR Generalist', label: 'HR Generalist', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'HR Coordinator', label: 'HR Coordinator', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'HR Assistant', label: 'HR Assistant', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Director of Finance', label: 'Director of Finance', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Finance Manager', label: 'Finance Manager', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Accounting Manager', label: 'Accounting Manager', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Assistant Controller', label: 'Assistant Controller', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Staff Accountant', label: 'Staff Accountant', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Accounts Payable Clerk', label: 'Accounts Payable Clerk', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Accounts Receivable Clerk', label: 'Accounts Receivable Clerk', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'General Cashier', label: 'General Cashier', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Income Auditor', label: 'Income Auditor', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Night Auditor Hotel Admin', label: 'Night Auditor', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Payroll Clerk', label: 'Payroll Clerk', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Cost Controller', label: 'Cost Controller', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Food & Beverage Controller', label: 'Food & Beverage Controller', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Purchasing Manager', label: 'Purchasing Manager', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Purchasing Clerk', label: 'Purchasing Clerk', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Receiving Clerk', label: 'Receiving Clerk', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Inventory Controller', label: 'Inventory Controller', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Credit Manager', label: 'Credit Manager', icon: QAManagerIcon, cat: 'Admin/ HR/ Finance/Purchase' },

    // IT
    { id: 'Director of IT', label: 'Director of IT', icon: EngineeringIcon, cat: 'IT' },
    { id: 'IT Manager', label: 'IT Manager', icon: EngineeringIcon, cat: 'IT' },
    { id: 'Systems Manager', label: 'Systems Manager', icon: EngineeringIcon, cat: 'IT' },
    { id: 'IT Support Specialist', label: 'IT Support Specialist', icon: EngineeringIcon, cat: 'IT' },
    { id: 'Help Desk Technician', label: 'Help Desk Technician', icon: EngineeringIcon, cat: 'IT' },
    { id: 'Network Administrator', label: 'Network Administrator', icon: EngineeringIcon, cat: 'IT' },
    { id: 'Systems Administrator', label: 'Systems Administrator', icon: EngineeringIcon, cat: 'IT' },
    { id: 'Database Administrator', label: 'Database Administrator', icon: EngineeringIcon, cat: 'IT' },
    { id: 'Web Developer', label: 'Web Developer', icon: EngineeringIcon, cat: 'IT' },
    { id: 'Software Developer', label: 'Software Developer', icon: EngineeringIcon, cat: 'IT' },
  ];

  const labRdRoles = [
    { id: 'RD Director LabRD', label: 'Research & Development Director', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Innovation Manager LabRD', label: 'Innovation Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Research Manager LabRD', label: 'Research Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Product Developer LabRD', label: 'Product Developer', icon: LabIcon, cat: 'Product Development' },
    { id: 'RD Chef LabRD', label: 'R&D Chef', icon: ChefHatIcon, cat: 'Product Development' },
    { id: 'Culinary Developer LabRD', label: 'Culinary Developer', icon: ChefHatIcon, cat: 'Product Development' },
    { id: 'Application Specialist LabRD', label: 'Application Specialist', icon: QASupervisorIcon, cat: 'Product Development' },
    { id: 'Food Scientist LabRD', label: 'Food Scientist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Flavor Chemist LabRD', label: 'Flavor Chemist', icon: AdditiveIcon, cat: 'Research & Laboratory' },
    { id: 'Texture Specialist LabRD', label: 'Texture Specialist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Ingredient Specialist LabRD', label: 'Ingredient Specialist', icon: AdditiveIcon, cat: 'Research & Laboratory' },
    { id: 'Recipe Formulator LabRD', label: 'Recipe Formulator', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Nutritionist LabRD', label: 'Nutritionist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Product Formulator LabRD', label: 'Product Formulator', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Sensory Analyst LabRD', label: 'Sensory Analyst', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Taste Tester LabRD', label: 'Taste Tester', icon: FoodIcon, cat: 'Research & Laboratory' },
    { id: 'Consumer Researcher LabRD', label: 'Consumer Researcher', icon: QASupervisorIcon, cat: 'Research & Laboratory' },
    { id: 'Panel Leader LabRD', label: 'Panel Leader', icon: QASupervisorIcon, cat: 'Research & Laboratory' },
    { id: 'Lab Technician LabRD', label: 'Lab Technician', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Research Associate LabRD', label: 'Research Associate', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Food Microbiologist LabRD', label: 'Food Microbiologist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Analytical Chemist LabRD', label: 'Analytical Chemist', icon: AdditiveIcon, cat: 'Research & Laboratory' },
    { id: 'Food Safety Specialist LabRD', label: 'Food Safety Specialist', icon: SafetyOfficerIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'HACCP Coordinator LabRD', label: 'HACCP Coordinator', icon: RegIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'Sanitarian LabRD', label: 'Sanitarian', icon: BroomIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'QA Manager LabRD', label: 'QA Manager', icon: QAManagerIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'Quality Systems Coordinator LabRD', label: 'Quality Systems Coordinator', icon: QASupervisorIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'Culinary Instructor LabRD', label: 'Culinary Instructor', icon: ChefHatIcon, cat: 'Education & Consultant' },
    { id: 'Cooking Teacher LabRD', label: 'Cooking Teacher', icon: ChefHatIcon, cat: 'Education & Consultant' },
    { id: 'Food Safety Trainer LabRD', label: 'Food Safety Trainer', icon: SafetyOfficerIcon, cat: 'Education & Consultant' },
    { id: 'Corporate Trainer LabRD', label: 'Corporate Trainer', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Food Business Consultant LabRD', label: 'Food Business Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Restaurant Consultant LabRD', label: 'Restaurant Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Menu Engineer LabRD', label: 'Menu Engineer', icon: FoodIcon, cat: 'Education & Consultant' },
    { id: 'Sustainability Consultant LabRD', label: 'Sustainability Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Food Attorney LabRD', label: 'Food Attorney', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Regulatory Consultant LabRD', label: 'Regulatory Consultant', icon: RegIcon, cat: 'Education & Consultant' },
    { id: 'Regulatory Affairs Specialist LabRD', label: 'Regulatory Affairs Specialist', icon: RegIcon, cat: 'Compliances' },
    { id: 'Compliance Officer LabRD', label: 'Compliance Officer', icon: SafetyOfficerIcon, cat: 'Compliances' },
    { id: 'Labeling Specialist LabRD', label: 'Labeling Specialist', icon: QASupervisorIcon, cat: 'Compliances' },
    { id: 'Registered Dietitian LabRD', label: 'Registered Dietitian', icon: GenericRoleIcon, cat: 'Nutritionist' },
    { id: 'Clinical Nutritionist LabRD', label: 'Clinical Nutritionist', icon: GenericRoleIcon, cat: 'Nutritionist' },
    { id: 'Public Health Nutritionist LabRD', label: 'Public Health Nutritionist', icon: GenericRoleIcon, cat: 'Nutritionist' },
    { id: 'WIC Coordinator LabRD', label: 'WIC Coordinator', icon: QASupervisorIcon, cat: 'Nutritionist' },
    { id: 'Corporate Nutritionist LabRD', label: 'Corporate Nutritionist', icon: GenericRoleIcon, cat: 'Nutritionist' },
    { id: 'Wellness Coordinator LabRD', label: 'Wellness Coordinator', icon: QASupervisorIcon, cat: 'Nutritionist' },
    { id: 'Sports Nutritionist LabRD', label: 'Sports Nutritionist', icon: GenericRoleIcon, cat: 'Nutritionist' },
    { id: 'Performance Dietitian LabRD', label: 'Performance Dietitian', icon: GenericRoleIcon, cat: 'Nutritionist' },
    { id: 'Food Equipment Engineer LabRD', label: 'Food Equipment Engineer', icon: EngineeringIcon, cat: 'Nutritionist' },
    { id: 'Food Writer LabRD', label: 'Food Writer', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Blogger LabRD', label: 'Food Blogger', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Content Creator LabRD', label: 'Content Creator', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Photographer LabRD', label: 'Food Photographer', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Stylist LabRD', label: 'Food Stylist', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Brand Manager LabRD', label: 'Food Brand Manager', icon: QAManagerIcon, cat: 'IT & Photography' },
    { id: 'Social Media Specialist LabRD', label: 'Social Media Specialist', icon: QASupervisorIcon, cat: 'IT & Photography' },
  ];

  const foodProcessingManagementRoles = [
    { id: 'Plant Manager FP', label: 'Plant Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Operations Director FP', label: 'Operations Director', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Production Manager FP', label: 'Production Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Factory Manager FP', label: 'Factory Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'R&D Director FP', label: 'R&D Director', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Innovation Manager FP', label: 'Innovation Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Research Manager FP', label: 'Research Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Restaurant Manager FP', label: 'Restaurant Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Bar Manager FP', label: 'Bar Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'F&B Manager FP', label: 'F&B Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Outlet Manager FP', label: 'Outlet Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Banquet Manager Mgmt FP', label: 'Banquet Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Human Resource Manager FP', label: 'Human Resource Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Supervisor FP', label: 'Supervisor', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Kitchen Manager FP', label: 'Kitchen Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Catering Manager Mgmt FP', label: 'Catering Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Event Coordinator FP', label: 'Event Coordinator', icon: LineHelperIcon, cat: 'Management' },
    { id: 'Purchase Manager FP', label: 'Purchase Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Store Manager FP', label: 'Store Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Cost Controller Mgmt FP', label: 'Cost Controller', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Store Incharge FP', label: 'Store Incharge', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Front Desk Mgmt FP', label: 'Front Desk', icon: FrontOfficeIcon, cat: 'Management' },
    { id: 'Asst Manager FP', label: 'Asst Manager', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Housekeeping Manager FP', label: 'Housekeeping Manager', icon: HousekeepingIcon, cat: 'Management' },
    { id: 'Cleaning Supervisor FP', label: 'Cleaning Supervisor', icon: BroomIcon, cat: 'Management' },
    { id: 'Chief Accountant FP', label: 'Chief Accountant', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Accounting Manager FP', label: 'Accounting Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Parcel Supervisor FP', label: 'Parcel Supervisor', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Warehouse Manager FP', label: 'Warehouse Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Operations Manager FP', label: 'Operations Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Shift Supervisor FP', label: 'Shift Supervisor', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Assistant Store Manager FP', label: 'Assistant Store Manager', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Department Manager FP', label: 'Department Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Supplier Relations Manager FP', label: 'Supplier Relations Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Procurement Manager FP', label: 'Procurement Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Shift Manager FP', label: 'Shift Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Production Supervisor FP', label: 'Production Supervisor', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Line Leader FP', label: 'Line Leader', icon: LeaderIcon, cat: 'Management' },
  ];

  const foodProcessingProductionRoles = [
    { id: 'Production Supervisor FP', label: 'Production Supervisor', icon: QASupervisorIcon, cat: 'Production / Manufacturing' },
    { id: 'Shift Manager FP', label: 'Shift Manager', icon: QAManagerIcon, cat: 'Production / Manufacturing' },
    { id: 'Line Lead FP', label: 'Line Lead', icon: LeaderIcon, cat: 'Production / Manufacturing' },
    { id: 'Team Leader FP', label: 'Team Leader', icon: LeaderIcon, cat: 'Production / Manufacturing' },
    { id: 'Line Operator FP', label: 'Line Operator', icon: OperatorIcon, cat: 'Production / Manufacturing' },
    { id: 'Assembly Worker FP', label: 'Assembly Worker', icon: ProductionIcon, cat: 'Production / Manufacturing' },
    { id: 'Machine Operator FP', label: 'Machine Operator', icon: OperatorIcon, cat: 'Production / Manufacturing' },
    { id: 'Production Associate FP', label: 'Production Associate', icon: ProductionIcon, cat: 'Production / Manufacturing' },
    { id: 'Butcher FP', label: 'Butcher', icon: MeatIcon, cat: 'Production / Manufacturing' },
    { id: 'Baker FP', label: 'Baker', icon: PastryIcon, cat: 'Production / Manufacturing' },
    { id: 'Batch Maker FP', label: 'Batch Maker', icon: ProductionIcon, cat: 'Production / Manufacturing' },
    { id: 'Mixer Operator FP', label: 'Mixer Operator', icon: OperatorIcon, cat: 'Production / Manufacturing' },
    { id: 'Grinder Operator FP', label: 'Grinder Operator', icon: OperatorIcon, cat: 'Production / Manufacturing' },
  ];

  const foodProcessingPackingRoles = [
    { id: 'Packaging Operator FP', label: 'Packaging Operator', icon: PackageIcon, cat: 'Packing' },
    { id: 'Filler Operator FP', label: 'Filler Operator', icon: PackageIcon, cat: 'Packing' },
    { id: 'Labeling Technician FP', label: 'Labeling Technician', icon: PackageIcon, cat: 'Packing' },
    { id: 'Sealing Machine Operator FP', label: 'Sealing Machine Operator', icon: PackageIcon, cat: 'Packing' },
  ];

  const foodProcessingQualityControlRoles = [
    { id: 'QC Inspector FP', label: 'QC Inspector', icon: InspectIcon, cat: 'Quality Control' },
    { id: 'Grader FP', label: 'Grader', icon: InspectIcon, cat: 'Quality Control' },
    { id: 'Sorter FP', label: 'Sorter', icon: InspectIcon, cat: 'Quality Control' },
    { id: 'Tester FP', label: 'Tester', icon: LabIcon, cat: 'Quality Control' },
    { id: 'Quality Technician FP', label: 'Quality Technician', icon: LabIcon, cat: 'Quality Control' },
  ];

  const foodProcessingMaintenanceEngineeringRoles = [
    { id: 'Maintenance Technician FP ME', label: 'Maintenance Technician', icon: EngineeringIcon, cat: 'Maintenance & Engineering' },
    { id: 'Industrial Engineer FP ME', label: 'Industrial Engineer', icon: EngineeringIcon, cat: 'Maintenance & Engineering' },
    { id: 'Refrigeration Technician FP ME', label: 'Refrigeration Technician', icon: FreezerIcon, cat: 'Maintenance & Engineering' },
    { id: 'Electrical Technician FP ME', label: 'Electrical Technician', icon: EngineeringIcon, cat: 'Maintenance & Engineering' },
    { id: 'Food Process Engineer FP ME', label: 'Food Process Engineer', icon: EngineeringIcon, cat: 'Maintenance & Engineering' },
    { id: 'Automation Specialist FP ME', label: 'Automation Specialist', icon: MachineHelperIcon, cat: 'Maintenance & Engineering' },
    { id: 'Facilities Engineer FP ME', label: 'Facilities Engineer', icon: EngineeringIcon, cat: 'Maintenance & Engineering' },
  ];

  const foodProcessingSanitisationRoles = [
    { id: 'Sanitation Manager FP', label: 'Sanitation Manager', icon: QAManagerIcon, cat: 'Sanitisation' },
    { id: 'Clean-in-Place Operator FP', label: 'Clean-in-Place Operator', icon: BroomIcon, cat: 'Sanitisation' },
    { id: 'Sanitation Worker FP', label: 'Sanitation Worker', icon: BroomIcon, cat: 'Sanitisation' },
  ];

  const foodProcessingRDRoles = [
    { id: 'Safety Coordinator FP RD', label: 'Safety Coordinator', icon: SafetyOfficerIcon, cat: researchAndDevelopmentCat },
    { id: 'HACCP Coordinator RD FP', label: 'HACCP Coordinator', icon: RegIcon, cat: researchAndDevelopmentCat },
    { id: 'Compliance Officer FP RD', label: 'Compliance Officer', icon: RegIcon, cat: researchAndDevelopmentCat },
    { id: 'Food Scientist FP RD', label: 'Food Scientist', icon: LabIcon, cat: researchAndDevelopmentCat },
    { id: 'Product Developer FP RD', label: 'Product Developer', icon: LabIcon, cat: researchAndDevelopmentCat },
    { id: 'Formulation Specialist FP RD', label: 'Formulation Specialist', icon: LabIcon, cat: researchAndDevelopmentCat },
  ];

  const foodProcessingFoodSafetyScienceRoles = [
    { id: 'Lab Technician FP FSS', label: 'Lab Technician', icon: LabIcon, cat: 'Food Safety & Food Science' },
    { id: 'Microbiologist FP FSS', label: 'Microbiologist', icon: LabIcon, cat: 'Food Safety & Food Science' },
    { id: 'Chemist FP FSS', label: 'Chemist', icon: LabIcon, cat: 'Food Safety & Food Science' },
    { id: 'Research Chef FP FSS', label: 'Research Chef', icon: ChefHatIcon, cat: 'Food Safety & Food Science' },
    { id: 'Innovation Manager FP FSS', label: 'Innovation Manager', icon: QAManagerIcon, cat: 'Food Safety & Food Science' },
    { id: 'Test Kitchen Staff FP FSS', label: 'Test Kitchen Staff', icon: ChefHatIcon, cat: 'Food Safety & Food Science' },
  ];

  const foodProcessingExecutiveLeadershipRoles = [
    { id: 'Chief Executive Officer (CEO) FP', label: 'Chief Executive Officer (CEO)', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Operating Officer (COO) FP', label: 'Chief Operating Officer (COO)', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Financial Officer (CFO) FP', label: 'Chief Financial Officer (CFO)', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Marketing Officer (CMO) FP', label: 'Chief Marketing Officer (CMO)', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Revenue Officer FP', label: 'Chief Revenue Officer', icon: QAManagerIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Regional Director FP', label: 'Regional Director', icon: QASupervisorIcon, cat: 'Executive / Hotel Leadership' },
    { id: 'Area General Manager FP', label: 'Area General Manager', icon: QASupervisorIcon, cat: 'Executive / Hotel Leadership' },
  ];

  const foodProcessingFrontOfficeMgmtRoles = [
    { id: 'Front Office Manager FP', label: 'Front Office Manager', icon: ManagementIcon, cat: 'Front Office Management' },
    { id: 'Assistant Front Office Manager FP', label: 'Assistant Front Office Manager', icon: ManagementIcon, cat: 'Front Office Management' },
    { id: 'Guest Relations Manager FP', label: 'Guest Relations Manager', icon: ManagementIcon, cat: 'Front Office Management' },
    { id: 'Night Manager FP', label: 'Night Manager', icon: ManagementIcon, cat: 'Front Office Management' },
    { id: 'Front Desk Supervisor FP', label: 'Front Desk Supervisor', icon: QASupervisorIcon, cat: 'Front Office Management' },
    { id: 'Front Desk Agent FP', label: 'Front Desk Agent', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Guest Service Agent FP', label: 'Guest Service Agent', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Receptionist FP', label: 'Receptionist', icon: FrontOfficeIcon, cat: 'Front Office Management' },
    { id: 'Night Auditor FP', label: 'Night Auditor', icon: FrontOfficeIcon, cat: 'Front Office Management' },
  ];

  const foodProcessingFBMgmtRoles = [
    { id: 'Banquet catering FP', label: 'Banquet catering', icon: CateringIcon, cat: 'Food & Beverage Management' },
    { id: 'Director of Food & Beverage FP', label: 'Director of Food & Beverage', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Assistant Director of Food & Beverage FP', label: 'Assistant Director of Food & Beverage', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'F&B Manager FP', label: 'F&B Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Outlet Manager FP', label: 'Outlet Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Manager FP', label: 'Banquet Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Room Service Manager FP', label: 'Room Service Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Catering Manager FP', label: 'Catering Manager', icon: CateringIcon, cat: 'Food & Beverage Management' },
    { id: 'Bar Manager FP', label: 'Bar Manager', icon: BarIcon, cat: 'Food & Beverage Management' },
    { id: 'Beverage Director FP', label: 'Beverage Director', icon: BarIcon, cat: 'Food & Beverage Management' },
    { id: 'Restaurant Manager FP', label: 'Restaurant Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'F&B Supervisor FP', label: 'F&B Supervisor', icon: QASupervisorIcon, cat: 'Food & Beverage Management' },
    { id: 'Head Server FP', label: 'Head Server', icon: TrayIcon, cat: 'Food & Beverage Management' },
    { id: 'Head Bartender FP', label: 'Head Bartender', icon: BarIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Captain FP', label: 'Banquet Captain', icon: QASupervisorIcon, cat: 'Food & Beverage Management' },
    { id: 'Room Service Supervisor FP', label: 'Room Service Supervisor', icon: QASupervisorIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Setup Attendant FP', label: 'Banquet Setup Attendant', icon: LineHelperIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Houseman FP', label: 'Banquet Houseman', icon: LineHelperIcon, cat: 'Food & Beverage Management' },
    { id: 'Banquet Porter FP', label: 'Banquet Porter', icon: LineHelperIcon, cat: 'Food & Beverage Management' },
    { id: 'Catering Coordinator FP', label: 'Catering Coordinator', icon: CateringIcon, cat: 'Food & Beverage Management' },
    { id: 'Catering Sales Manager FP', label: 'Catering Sales Manager', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
    { id: 'Event Planner FP', label: 'Event Planner', icon: QAManagerIcon, cat: 'Food & Beverage Management' },
  ];

  const foodProcessingBellServiceRoles = [
    { id: 'Bell Captain FP', label: 'Bell Captain', icon: QASupervisorIcon, cat: 'Bell Service / Room Attendant' },
    { id: 'Bell Attendant FP', label: 'Bell Attendant', icon: LineHelperIcon, cat: 'Bell Service / Room Attendant' },
    { id: 'Doorman FP', label: 'Doorman', icon: DoorIcon, cat: 'Bell Service / Room Attendant' },
    { id: 'Luggage Porter FP', label: 'Luggage Porter', icon: LineHelperIcon, cat: 'Bell Service / Room Attendant' },
  ];

  const foodProcessingHousekeepingMgmtRoles = [
    { id: 'Executive Housekeeper FP', label: 'Executive Housekeeper', icon: HousekeepingIcon, cat: 'Housekeeping Management/Laundry' },
    { id: 'Housekeeping Manager FP', label: 'Housekeeping Manager', icon: QAManagerIcon, cat: 'Housekeeping Management/Laundry' },
    { id: 'Laundry Manager FP', label: 'Laundry Manager', icon: QAManagerIcon, cat: 'Housekeeping Management/Laundry' },
    { id: 'Housekeeping Supervisor FP', label: 'Housekeeping Supervisor', icon: QASupervisorIcon, cat: 'Housekeeping Management/Laundry' },
    { id: 'Room Attendant FP', label: 'Room Attendant', icon: BroomIcon, cat: 'Housekeeping Management/Laundry' },
  ];

  const foodProcessingKitchenBarStaffRoles = [
    { id: 'Executive Chef FP', label: 'Executive Chef', icon: ChefHatIcon, cat: 'Kitchen / Bar Staff' },
    { id: 'Sous Chef FP', label: 'Sous Chef', icon: ChefHatIcon, cat: 'Kitchen / Bar Staff' },
    { id: 'Line Cook FP', label: 'Line Cook', icon: StoveIcon, cat: 'Kitchen / Bar Staff' },
    { id: 'Kitchen Steward FP', label: 'Kitchen Steward', icon: LineHelperIcon, cat: 'Kitchen / Bar Staff' },
    { id: 'Dishwasher FP', label: 'Dishwasher', icon: BroomIcon, cat: 'Kitchen / Bar Staff' },
  ];

  const foodProcessingServiceStaffRoles = [
    { id: 'Server/Waiter FP', label: 'Server/Waiter', icon: TrayIcon, cat: 'Service Staff' },
    { id: 'Banquet Server FP', label: 'Banquet Server', icon: TrayIcon, cat: 'Service Staff' },
    { id: 'Bartender FP', label: 'Bartender', icon: BarIcon, cat: 'Service Staff' },
    { id: 'Host/Hostess FP', label: 'Host/Hostess', icon: LineHelperIcon, cat: 'Service Staff' },
  ];

  const foodProcessingSalesMarketingRoles = [
    { id: 'Director of Sales & Marketing FP', label: 'Director of Sales & Marketing', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Manager FP', label: 'Sales Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Marketing Manager FP', label: 'Marketing Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Digital Marketing Manager FP', label: 'Digital Marketing Manager', icon: QAManagerIcon, cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Executive FP', label: 'Sales Executive', icon: QASupervisorIcon, cat: 'Sales & Marketing / Digital Sales' },
  ];

  const foodProcessingSecurityMaintenanceRoles = [
    { id: 'Security Manager FP', label: 'Security Manager', icon: QAManagerIcon, cat: 'Security & Maintenance' },
    { id: 'Security Supervisor FP', label: 'Security Supervisor', icon: QASupervisorIcon, cat: 'Security & Maintenance' },
    { id: 'Security Officer FP', label: 'Security Officer', icon: SafetyOfficerIcon, cat: 'Security & Maintenance' },
    { id: 'Maintenance Technician SM FP', label: 'Maintenance Technician', icon: EngineeringIcon, cat: 'Security & Maintenance' },
  ];

  const foodProcessingAdminHRFinanceRoles = [
    { id: 'HR Manager FP', label: 'HR Manager', icon: QAManagerIcon, cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Finance Manager FP', label: 'Finance Manager', icon: QAManagerIcon, cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Purchasing Manager FP', label: 'Purchasing Manager', icon: QAManagerIcon, cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Accountant FP', label: 'Accountant', icon: LineHelperIcon, cat: 'Admin / HR / Finance / Purchase' },
  ];

  const foodProcessingITRoles = [
    { id: 'IT Manager FP', label: 'IT Manager', icon: ManagementIcon, cat: 'IT' },
    { id: 'IT Support Specialist FP', label: 'IT Support Specialist', icon: QASupervisorIcon, cat: 'IT' },
    { id: 'Network Administrator FP', label: 'Network Administrator', icon: QASupervisorIcon, cat: 'IT' },
  ];

  const foodProcessingProductDevelopmentRoles = [
    { id: 'Product Developer FP', label: 'Product Developer', icon: LabIcon, cat: 'Product Development' },
    { id: 'R&D Chef FP', label: 'R&D Chef', icon: ChefHatIcon, cat: 'Product Development' },
    { id: 'Culinary Developer FP', label: 'Culinary Developer', icon: ChefHatIcon, cat: 'Product Development' },
    { id: 'Application Specialist FP', label: 'Application Specialist', icon: QASupervisorIcon, cat: 'Product Development' },
  ];

  const foodProcessingResearchLabRoles = [
    { id: 'Food Scientist RL FP', label: 'Food Scientist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Flavor Chemist RL FP', label: 'Flavor Chemist', icon: AdditiveIcon, cat: 'Research & Laboratory' },
    { id: 'Texture Specialist RL FP', label: 'Texture Specialist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Ingredient Specialist RL FP', label: 'Ingredient Specialist', icon: AdditiveIcon, cat: 'Research & Laboratory' },
    { id: 'Recipe Formulator RL FP', label: 'Recipe Formulator', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Nutritionist RL FP', label: 'Nutritionist', icon: FoodIcon, cat: 'Research & Laboratory' },
    { id: 'Product Formulator RL FP', label: 'Product Formulator', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Sensory Analyst RL FP', label: 'Sensory Analyst', icon: InspectIcon, cat: 'Research & Laboratory' },
    { id: 'Taste Tester RL FP', label: 'Taste Tester', icon: FoodIcon, cat: 'Research & Laboratory' },
    { id: 'Consumer Researcher RL FP', label: 'Consumer Researcher', icon: QASupervisorIcon, cat: 'Research & Laboratory' },
    { id: 'Panel Leader RL FP', label: 'Panel Leader', icon: QASupervisorIcon, cat: 'Research & Laboratory' },
    { id: 'Lab Technician RL FP', label: 'Lab Technician', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Research Associate RL FP', label: 'Research Associate', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Food Microbiologist RL FP', label: 'Food Microbiologist', icon: LabIcon, cat: 'Research & Laboratory' },
  ];

  const foodProcessingFoodSafetyQARoles = [
    { id: 'Food Safety Specialist FP QA', label: 'Food Safety Specialist', icon: SafetyOfficerIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'HACCP Coordinator FP QA', label: 'HACCP Coordinator', icon: RegIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'Sanitarian FP QA', label: 'Sanitarian', icon: BroomIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'QA Manager FP QA', label: 'QA Manager', icon: QAManagerIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'Quality Systems Coordinator FP QA', label: 'Quality Systems Coordinator', icon: QASupervisorIcon, cat: 'Food Safety & Quality Assurance' },
  ];

  const foodProcessingEducationConsultantRoles = [
    { id: 'Culinary Instructor FP EC', label: 'Culinary Instructor', icon: ChefHatIcon, cat: 'Education & Consultant' },
    { id: 'Cooking Teacher FP EC', label: 'Cooking Teacher', icon: ChefHatIcon, cat: 'Education & Consultant' },
    { id: 'Food Safety Trainer FP EC', label: 'Food Safety Trainer', icon: SafetyOfficerIcon, cat: 'Education & Consultant' },
    { id: 'Corporate Trainer FP EC', label: 'Corporate Trainer', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Food Business Consultant FP EC', label: 'Food Business Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Restaurant Consultant FP EC', label: 'Restaurant Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Menu Engineer FP EC', label: 'Menu Engineer', icon: FoodIcon, cat: 'Education & Consultant' },
    { id: 'Sustainability Consultant FP EC', label: 'Sustainability Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Food Attorney FP EC', label: 'Food Attorney', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Regulatory Consultant FP EC', label: 'Regulatory Consultant', icon: RegIcon, cat: 'Education & Consultant' },
  ];

  const foodProcessingCompliancesRoles = [
    { id: 'Regulatory Affairs Specialist FP CP', label: 'Regulatory Affairs Specialist', icon: RegIcon, cat: 'Compliances' },
    { id: 'Compliance Officer FP CP', label: 'Compliance Officer', icon: SafetyOfficerIcon, cat: 'Compliances' },
    { id: 'Labeling Specialist FP CP', label: 'Labeling Specialist', icon: QASupervisorIcon, cat: 'Compliances' },
  ];

  const foodProcessingITPhotographyRoles = [
    { id: 'Food Writer FP ITP', label: 'Food Writer', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Blogger FP ITP', label: 'Food Blogger', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Content Creator FP ITP', label: 'Content Creator', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Photographer FP ITP', label: 'Food Photographer', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Stylist FP ITP', label: 'Food Stylist', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Brand Manager FP ITP', label: 'Food Brand Manager', icon: QAManagerIcon, cat: 'IT & Photography' },
    { id: 'Social Media Specialist FP ITP', label: 'Social Media Specialist', icon: QASupervisorIcon, cat: 'IT & Photography' },
  ];

  const foodProcessingAdminAccountantRoles = [
    { id: 'Cashier FP AA', label: 'Cashier', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Billing FP AA', label: 'Billing', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Admin Assistant FP AA', label: 'Admin Assistant', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Receptionist FP AA', label: 'Receptionist', icon: FrontOfficeIcon, cat: 'Admin / Accountant' },
    { id: 'HR Assistant FP AA', label: 'HR Assistant', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Clerk FP AA', label: 'Clerk', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Data Entry FP AA', label: 'Data Entry', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Store Assistant FP AA', label: 'Store Assistant', icon: LineHelperIcon, cat: 'Admin / Accountant' },
    { id: 'Purchase Assistant FP AA', label: 'Purchase Assistant', icon: LineHelperIcon, cat: 'Admin / Accountant' },
  ];

  const foodProcessingPurchaseStoreRoles = [
    { id: 'Service/Waiter FP PS', label: 'Service/Waiter', icon: TrayIcon, cat: 'Purchase / Store' },
    { id: 'Food Runner FP PS', label: 'Food Runner', icon: FoodIcon, cat: 'Purchase / Store' },
    { id: 'Captain FP PS', label: 'Captain', icon: QASupervisorIcon, cat: 'Purchase / Store' },
    { id: 'Bar Tender FP PS', label: 'Bar Tender', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Bar Back FP PS', label: 'Bar Back', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Sommelier/Wine Steward FP PS', label: 'Sommelier/Wine Steward', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Mixologist FP PS', label: 'Mixologist', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Barista FP PS', label: 'Barista', icon: CoffeeIcon, cat: 'Purchase / Store' },
    { id: 'Greeter FP PS', label: 'Greeter', icon: LineHelperIcon, cat: 'Purchase / Store' },
    { id: 'Reservationist FP PS', label: 'Reservationist', icon: LineHelperIcon, cat: 'Purchase / Store' },
    { id: 'Counter/Parcel FP PS', label: 'Counter/Parcel', icon: LineHelperIcon, cat: 'Purchase / Store' },
    { id: 'Buffet Attendant FP PS', label: 'Buffet Attendant', icon: TrayIcon, cat: 'Purchase / Store' },
    { id: 'Store Keeper FP PS', label: 'Store Keeper', icon: PurchaseIcon, cat: 'Purchase / Store' },
    { id: 'Purchase Assistant FP PS', label: 'Purchase Assistant', icon: LineHelperIcon, cat: 'Purchase / Store' },
  ];

  const foodProcessingKitchenOperationRoles = [
    { id: 'Executive Chef KO FP', label: 'Executive Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Corporate Chef KO FP', label: 'Corporate Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Sous Chef KO FP', label: 'Sous Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Culinary Director KO FP', label: 'Culinary Director', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: "Maitre d' KO FP", label: "Maitre d'", icon: QAManagerIcon, cat: 'Kitchen / Operation' },
    { id: 'Chef de Cuisine KO FP', label: 'Chef de Cuisine', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Commis 1 KO FP', label: 'Commis 1', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Commis 2 KO FP', label: 'Commis 2', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Commis 3 KO FP', label: 'Commis 3', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Line Cook KO FP', label: 'Line Cook', icon: StoveIcon, cat: 'Kitchen / Operation' },
    { id: 'Fry Cook KO FP', label: 'Fry Cook', icon: StoveIcon, cat: 'Kitchen / Operation' },
    { id: 'Pantry Cook KO FP', label: 'Pantry Cook', icon: StoveIcon, cat: 'Kitchen / Operation' },
    { id: 'Pantry Chef KO FP', label: 'Pantry Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Pizza Chef KO FP', label: 'Pizza Chef', icon: PizzaIcon, cat: 'Kitchen / Operation' },
    { id: 'Sushi Chef KO FP', label: 'Sushi Chef', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Kitchen Assistant KO FP', label: 'Kitchen Assistant', icon: LineHelperIcon, cat: 'Kitchen / Operation' },
    { id: 'Vegetable Cutter KO FP', label: 'Vegetable Cutter', icon: CuttingCleaningIcon, cat: 'Kitchen / Operation' },
    { id: 'Kitchen Porter KO FP', label: 'Kitchen Porter', icon: LineHelperIcon, cat: 'Kitchen / Operation' },
    { id: 'Banquet Chef KO FP', label: 'Banquet Chef', icon: ChefHatIcon, cat: 'Kitchen / Operation' },
    { id: 'Chinese Master KO FP', label: 'Chinese Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Tandoori/Grill Chef KO FP', label: 'Tandoori/Grill Chef', icon: StoveIcon, cat: 'Kitchen / Operation' },
    { id: 'South Indian Cook KO FP', label: 'South Indian Cook', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'North Indian Cook KO FP', label: 'North Indian Cook', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Continental Cook KO FP', label: 'Continental Cook', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Recipe Tester KO FP', label: 'Recipe Tester', icon: LabIcon, cat: 'Kitchen / Operation' },
    { id: 'Sweet Master KO FP', label: 'Sweet Master', icon: PastryIcon, cat: 'Kitchen / Operation' },
    { id: 'Savouries Master KO FP', label: 'Savouries Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Bakery Master KO FP', label: 'Bakery Master', icon: PastryIcon, cat: 'Kitchen / Operation' },
    { id: 'Chocolate Artist KO FP', label: 'Chocolate Artist', icon: PastryIcon, cat: 'Kitchen / Operation' },
    { id: 'Tea Master KO FP', label: 'Tea Master', icon: CoffeeIcon, cat: 'Kitchen / Operation' },
    { id: 'Juice Master KO FP', label: 'Juice Master', icon: CoffeeIcon, cat: 'Kitchen / Operation' },
    { id: 'Vada Bujji Bonda Master KO FP', label: 'Vada/Bujji/Bonda Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Chat Master KO FP', label: 'Chat Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
    { id: 'Dosa Parotta Master KO FP', label: 'Dosa/Parotta Master', icon: FoodIcon, cat: 'Kitchen / Operation' },
  ];

  const foodProcessingCleaningMaintenanceRoles = [
    { id: 'Dishwashing CM FP', label: 'Dishwashing', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'Kitchen Cleaning CM FP', label: 'Kitchen Cleaning', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'RestRoom Cleaning CM FP', label: 'RestRoom Cleaning', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'Electrician Plumber CM FP', label: 'Electrician/Plumber', icon: ToolsIcon, cat: 'Cleaning / Maintenance' },
  ];

  const foodProcessingProcurementPurchaseRoles = [
    { id: 'Buyer Purchasing Agent FP PP', label: 'Buyer Purchasing Agent', icon: LineHelperIcon, cat: 'Procurement / Purchase' },
    { id: 'Sourcing Specialist FP PP', label: 'Sourcing Specialist', icon: LineHelperIcon, cat: 'Procurement / Purchase' },
    { id: 'Vendor Coordinator FP PP', label: 'Vendor Coordinator', icon: LineHelperIcon, cat: 'Procurement / Purchase' },
    { id: 'Frozen Food Specialist FP PP', label: 'Frozen Food Specialist', icon: FreezerIcon, cat: 'Procurement / Purchase' },
  ];

  const foodProcessingWarehouseInventoryRoles = [
    { id: 'Forklift Operator FP WI', label: 'Forklift Operator', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Order Picker FP WI', label: 'Order Picker', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Palletizer FP WI', label: 'Palletizer', icon: PackageIcon, cat: 'Warehouse / Inventory' },
    { id: 'Reach Truck Operator FP WI', label: 'Reach Truck Operator', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Receiver FP WI', label: 'Receiver', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Dock Worker FP WI', label: 'Dock Worker', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Unloader FP WI', label: 'Unloader', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Checker FP WI', label: 'Checker', icon: QASupervisorIcon, cat: 'Warehouse / Inventory' },
    { id: 'Shipper FP WI', label: 'Shipper', icon: PackageIcon, cat: 'Warehouse / Inventory' },
    { id: 'Loader FP WI', label: 'Loader', icon: PackageIcon, cat: 'Warehouse / Inventory' },
    { id: 'Dispatch Coordinator FP WI', label: 'Dispatch Coordinator', icon: QAManagerIcon, cat: 'Warehouse / Inventory' },
    { id: 'Inventory Clerk FP WI', label: 'Inventory Clerk', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Cycle Counter FP WI', label: 'Cycle Counter', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Stock Keeper FP WI', label: 'Stock Keeper', icon: LineHelperIcon, cat: 'Warehouse / Inventory' },
    { id: 'Warehouse Supervisor FP WI', label: 'Warehouse Supervisor', icon: QASupervisorIcon, cat: 'Warehouse / Inventory' },
  ];

  const foodProcessingLogisticsSupplyChainRoles = [
    { id: 'Truck Driver CDL FP LS', label: 'Truck Driver (CDL)', icon: DispatchIcon, cat: 'Logistics and supply chain' },
    { id: 'Delivery Driver FP LS', label: 'Delivery Driver', icon: DispatchIcon, cat: 'Logistics and supply chain' },
    { id: 'Route Driver FP LS', label: 'Route Driver', icon: DispatchIcon, cat: 'Logistics and supply chain' },
    { id: 'Box Truck Driver FP LS', label: 'Box Truck Driver', icon: DispatchIcon, cat: 'Logistics and supply chain' },
    { id: 'Fleet Manager FP LS', label: 'Fleet Manager', icon: QAManagerIcon, cat: 'Logistics and supply chain' },
    { id: 'Dispatcher FP LS', label: 'Dispatcher', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Route Planner FP LS', label: 'Route Planner', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Fleet Maintenance Supervisor FP LS', label: 'Fleet Maintenance Supervisor', icon: QAManagerIcon, cat: 'Logistics and supply chain' },
    { id: 'Refrigeration Technician FP LS', label: 'Refrigeration Technician', icon: ColdIcon, cat: 'Logistics and supply chain' },
    { id: 'Temperature Monitor FP LS', label: 'Temperature Monitor', icon: ColdIcon, cat: 'Logistics and supply chain' },
    { id: 'Cold Room Supervisor FP LS', label: 'Cold Room Supervisor', icon: ColdIcon, cat: 'Logistics and supply chain' },
    { id: 'Logistics Coordinator FP LS', label: 'Logistics Coordinator', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Traffic Manager FP LS', label: 'Traffic Manager', icon: QAManagerIcon, cat: 'Logistics and supply chain' },
    { id: 'Freight Broker FP LS', label: 'Freight Broker', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Import/Export Coordinator FP LS', label: 'Import/Export Coordinator', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Supply Chain Planner FP LS', label: 'Supply Chain Planner', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Demand Planner FP LS', label: 'Demand Planner', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Replenishment Analyst FP LS', label: 'Replenishment Analyst', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
  ];

  const foodProcessingCustomerServiceSalesRoles = [
    { id: 'Sales Associate FP CSS', label: 'Sales Associate', icon: ShopIcon, cat: 'Customer service and Sales' },
    { id: 'Stock Clerk FP CSS', label: 'Stock Clerk', icon: BoxIcon, cat: 'Customer service and Sales' },
    { id: 'Shelf Stocker FP CSS', label: 'Shelf Stocker', icon: BoxIcon, cat: 'Customer service and Sales' },
    { id: 'Merchandiser FP CSS', label: 'Merchandiser', icon: ShopIcon, cat: 'Customer service and Sales' },
    { id: 'Customer Service Representative FP CSS', label: 'Customer Service Representative', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Greeter FP CSS', label: 'Greeter', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Information Desk Clerk FP CSS', label: 'Information Desk Clerk', icon: FrontOfficeIcon, cat: 'Customer service and Sales' },
  ];

  const foodProcessingEcommerceDigitalRoles = [
    { id: 'E-commerce Manager FP ED', label: 'E-commerce Manager', icon: QAManagerIcon, cat: 'Ecommerce & Digital' },
    { id: 'Online Order Picker FP ED', label: 'Online Order Picker', icon: BoxIcon, cat: 'Ecommerce & Digital' },
    { id: 'Curbside Attendant FP ED', label: 'Curbside Attendant', icon: LineHelperIcon, cat: 'Ecommerce & Digital' },
    { id: 'Personal Shopper FP ED', label: 'Personal Shopper', icon: LineHelperIcon, cat: 'Ecommerce & Digital' },
    { id: 'Online Merchandiser FP ED', label: 'Online Merchandiser', icon: ShopIcon, cat: 'Ecommerce & Digital' },
    { id: 'Product Lister FP ED', label: 'Product Lister', icon: LineHelperIcon, cat: 'Ecommerce & Digital' },
    { id: 'Content Creator FP ED', label: 'Content Creator', icon: LineHelperIcon, cat: 'Ecommerce & Digital' },
  ];

  const foodProcessingAccountsRoles = [
    { id: 'Accountant FP Accounts Section', label: 'Accountant', icon: LineHelperIcon, cat: 'Accounts' },
    { id: 'Audit Assistant FP', label: 'Audit Assistant', icon: LineHelperIcon, cat: 'Accounts' },
  ];

  const foodProcessingRoles = [
    ...foodProcessingManagementRoles,
    ...foodProcessingProductionRoles,
    ...foodProcessingPackingRoles,
    ...foodProcessingQualityControlRoles,
    ...foodProcessingMaintenanceEngineeringRoles,
    ...foodProcessingSanitisationRoles,
    ...foodProcessingRDRoles,
    ...foodProcessingFoodSafetyScienceRoles,
    ...foodProcessingExecutiveLeadershipRoles,
    ...foodProcessingFrontOfficeMgmtRoles,
    ...foodProcessingFBMgmtRoles,
    ...foodProcessingBellServiceRoles,
    ...foodProcessingHousekeepingMgmtRoles,
    ...foodProcessingKitchenBarStaffRoles,
    ...foodProcessingServiceStaffRoles,
    ...foodProcessingSalesMarketingRoles,
    ...foodProcessingSecurityMaintenanceRoles,
    ...foodProcessingAdminHRFinanceRoles,
    ...foodProcessingITRoles,
    ...foodProcessingProductDevelopmentRoles,
    ...foodProcessingResearchLabRoles,
    ...foodProcessingFoodSafetyQARoles,
    ...foodProcessingEducationConsultantRoles,
    ...foodProcessingCompliancesRoles,
    ...foodProcessingITPhotographyRoles,
    ...foodProcessingAdminAccountantRoles,
    ...foodProcessingPurchaseStoreRoles,
    ...foodProcessingKitchenOperationRoles,
    ...foodProcessingCleaningMaintenanceRoles,
    ...foodProcessingProcurementPurchaseRoles,
    ...foodProcessingWarehouseInventoryRoles,
    ...foodProcessingLogisticsSupplyChainRoles,
    ...foodProcessingCustomerServiceSalesRoles,
    ...foodProcessingEcommerceDigitalRoles,
    ...foodProcessingAccountsRoles,
  ];

  const getRolesForType = (type: string) => {
    switch (type.trim()) {
      case 'Restaurant/Bakery/Bar': return [...restaurantManagementRoles, ...restaurantAdminAccountantRoles, ...restaurantPurchaseStoreRoles, ...restaurantKitchenOperationRoles, ...restaurantCleaningMaintenanceRoles];
      case 'Hotel & Accomodation': return hotelAndAccomodationRoles;
      case 'Laboratory/R&D': return labRdRoles;
      case 'Retail/Distribution': return [...retailManagementRoles, ...retailProcurementRoles, ...retailWarehouseInventoryRoles, ...retailLogisticsRoles, ...retailCustomerServiceRoles, ...retailEcommerceRoles, ...retailComplianceRoles, ...retailQualityRoles, ...retailAccountsRoles];
      case 'Food Processing Industry': return foodProcessingRoles;
      default: return [];
    }
  };

  const jobRoles = selectedBusinessTypes.flatMap(getRolesForType);

  const filteredJobRoles = jobRoles.length > 0
    ? Array.from(new Map(
      jobRoles
        .filter((role: any) => selectedJobCategories.length === 0 || selectedJobCategories.includes(role.cat))
        .map(item => [item.id, item])
    ).values())
    : [];

  const calculateCompletion = () => {
    let percentage = 0;
    if (selectedBusinessTypes.length > 0) percentage += 20;
    if (selectedJobCategories.length > 0) percentage += 20;
    if (selectedRoles.length > 0) percentage += 20;
    if (languagesKnown.length > 0) percentage += 20;
    if (!isEducated || (isEducated && educationLevel)) percentage += 20;
    return percentage;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.white }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="dark" />
      <AppHeader showBack showLanguage={true} showCallSupport={true} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.vibrantHeader}>
          <ProgressIndicator
            currentStep={2}
            totalSteps={2}
            percentage={calculateCompletion()}
            stepTitle={t('professionalDetails') || "Professional Details"}
          />
          <View style={styles.headerHero}>
            <View style={styles.heroTextBox}>
              <Text style={styles.vibrantTitle}>{t('professionalDetails') || 'Professional Details'}</Text>
              <Text style={styles.vibrantSubtitle}>{t('professionalSummarySubtitle') || 'Complete your professional summary'}</Text>
            </View>
            <View style={styles.heroIconBox}>
              <Briefcase size={45} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        </View>

        <FadeInView style={[styles.floatingWorkspace, isDesktop && styles.desktopContent]}>
          <View style={styles.islandSurface}>

            {isEducated && (
              <View style={styles.islandSection}>
                <View style={styles.sectionHeading}>
                  <View style={[styles.accentRing, { borderColor: '#4CAF50' }]} />
                  <Text style={styles.islandSectionTitle}>{t('educationDetails') || 'Education Details'}</Text>
                </View>

                <View style={styles.vibrantInputRow}>
                  <Text style={styles.modernLabel}>{t('educationLevel') || 'Highest Qualification'} <Text style={styles.required}>*</Text></Text>
                  <View style={styles.chipContainer}>
                    {educationLevels.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.chip, educationLevel === level && styles.chipSelected]}
                        onPress={() => setEducationLevel(level)}
                      >
                        <Text style={[styles.chipText, educationLevel === level && styles.chipTextSelected]}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {educationLevel && (
                  <FadeInView>
                    <View style={styles.vibrantInputRow}>
                      <Text style={styles.modernLabel}>{t('degreeName') || 'Degree / Specialization'}</Text>
                      <View style={styles.vibrantInputBox}>
                        <MaterialCommunityIcons name="certificate" size={22} color={COLORS.primary} />
                        <TextInput
                          style={styles.modernTextInput}
                          placeholder="e.g. B.Sc Hotel Management"
                          placeholderTextColor={COLORS.textLight}
                          value={degree}
                          onChangeText={setDegree}
                        />
                      </View>
                    </View>

                    <View style={styles.vibrantInputRow}>
                      <Text style={styles.modernLabel}>{t('collegeName') || 'College / School Name'}</Text>
                      <View style={styles.vibrantInputBox}>
                        <MaterialCommunityIcons name="school" size={22} color={COLORS.primary} />
                        <TextInput
                          style={styles.modernTextInput}
                          placeholder="Enter institution name"
                          placeholderTextColor={COLORS.textLight}
                          value={college}
                          onChangeText={setCollege}
                        />
                      </View>
                    </View>
                  </FadeInView>
                )}
              </View>
            )}

            <View style={[styles.islandSection, isEducated ? { paddingTop: 0 } : {}]}>
              <View style={styles.sectionHeading}>
                <View style={[styles.accentRing, { borderColor: COLORS.primary }]} />
                <Text style={styles.islandSectionTitle}>{t('professionalExperience') || 'Experience & Role'}</Text>
              </View>

              {/* Business Type */}
              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('businessType') || 'Business Type'} <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.vibrantSelectBox}
                  onPress={() => setIsBTModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <Store size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vibrantSelectText, selectedBusinessTypes.length === 0 && styles.placeholderText]} numberOfLines={1}>
                        {selectedBusinessTypes.length > 0
                          ? selectedBusinessTypes.length === 1
                            ? businessTypes.find(t => t.id === selectedBusinessTypes[0])?.label
                            : `${selectedBusinessTypes.length} ${t('typesSelected') || 'Selected'}`
                          : t('selectBusinessType') || "Select Business Type"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {/* Job Category */}
              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={styles.modernLabel}>{t('jobCategory') || 'Job Category'} <Text style={styles.required}>*</Text></Text>
                </View>
                <TouchableOpacity
                  style={styles.vibrantSelectBox}
                  onPress={() => setIsCategoryModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <MaterialCommunityIcons name="view-grid-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, selectedJobCategories.length === 0 && styles.placeholderText]}>
                      {selectedJobCategories.length > 0
                        ? `${selectedJobCategories.length} ${t('categoriesSelected') || 'Categories Selected'}`
                        : t('selectCategory') || "Select Category"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {/* Job Role */}
              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={styles.modernLabel}>{t('preferredRole') || 'Preferred Job Role'} <Text style={styles.required}>*</Text></Text>
                </View>
                <TouchableOpacity
                  style={styles.vibrantSelectBox}
                  onPress={() => setIsRoleModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <MaterialCommunityIcons name="briefcase-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, selectedRoles.length === 0 && styles.placeholderText]}>
                      {selectedRoles.length > 0
                        ? `${selectedRoles.length} ${t('rolesSelected') || 'Roles Selected'}`
                        : t('selectRole') || "Select Job Role"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {/* Experience */}
              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={styles.modernLabel}>{t('experience') || 'Experience (Years)'}</Text>
                  <View style={styles.vibrantBadge}>
                    <Text style={styles.vibrantBadgeText}>Optional</Text>
                  </View>
                </View>
                <View style={styles.vibrantInputBox}>
                  <Feather name="clock" size={22} color={COLORS.primary} />
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder="e.g. 2"
                    placeholderTextColor={COLORS.textLight}
                    value={experience}
                    onChangeText={(text) => setExperience(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Language Known & Salary Section */}
            <View style={[styles.islandSection, { paddingTop: 0 }]}>
              {/* Language Known */}
              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={styles.modernLabel}>{t('languageKnown') || 'Language Known'} <Text style={styles.required}>*</Text></Text>
                </View>
                <View style={[styles.vibrantInputBox, { height: 'auto', paddingVertical: 15 }]}>
                  <View style={styles.chipContainer}>
                    {supportedLanguages.map((lang) => {
                      const isSelected = languagesKnown.includes(lang.value);
                      return (
                        <TouchableOpacity
                          key={lang.value}
                          style={[styles.chip, isSelected && styles.chipSelected]}
                          onPress={() => {
                            if (isSelected) {
                              setLanguagesKnown(languagesKnown.filter(l => l !== lang.value));
                            } else {
                              setLanguagesKnown([...languagesKnown, lang.value]);
                            }
                          }}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {lang.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Expected Salary */}
              <View style={styles.vibrantInputRow}>
                <View style={[styles.labelRowWithBadge, { marginBottom: 12 }]}>
                  <Text style={styles.modernLabel}>{t('expectedSalary') || 'Expected Monthly Salary'} <Text style={styles.required}>*</Text></Text>
                </View>
                <View style={[styles.vibrantInputBox, { minHeight: 60 }]}>
                  <Text style={{ fontSize: 20, color: COLORS.primary, fontWeight: '900', marginRight: 10, marginLeft: 5 }}>₹</Text>
                  <TextInput
                    style={styles.modernTextInput}
                    placeholder={t('expectedSalaryPlaceholder') || 'e.g. 15,000'}
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="number-pad"
                    value={expectedSalary}
                    maxLength={7}
                    onChangeText={(text) => {
                      const numericVal = text.replace(/[^0-9]/g, '');
                      setExpectedSalary(numericVal);
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </View>
        </FadeInView>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={isCategoryModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsCategoryModalOpen(false);
          setCategorySearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('selectCategory') || 'Select Job Category'}</Text>
                <Text style={styles.modalSubtitle}>{selectedJobCategories.length} {t('selected')}</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsCategoryModalOpen(false); setCategorySearch(''); }} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Feather name="search" size={20} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('searchCategory') || "Search category..."}
                placeholderTextColor={COLORS.textLight}
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {categoryList
                .filter(cat => cat.label.toLowerCase().includes(categorySearch.toLowerCase()))
                .map((cat) => {
                  const isSelected = selectedJobCategories.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedJobCategories(selectedJobCategories.filter(id => id !== cat.id));
                        } else {
                          setSelectedJobCategories([...selectedJobCategories, cat.id]);
                        }
                        setSelectedRoles([]);
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <View style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: isSelected ? COLORS.primary : COLORS.border,
                          backgroundColor: isSelected ? COLORS.primary : 'transparent',
                          marginRight: 12,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Feather name="check" size={14} color={COLORS.white} />}
                        </View>
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                          {cat.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
              <PrimaryButton title={t('done') || "Done"} onPress={() => { setIsCategoryModalOpen(false); setCategorySearch(''); }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Modal */}
      <Modal
        visible={isRoleModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsRoleModalOpen(false);
          setRoleSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('preferredRole') || 'Select Preferred Role'}</Text>
                <Text style={styles.modalSubtitle}>{selectedRoles.length} {t('selected')}</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsRoleModalOpen(false); setRoleSearch(''); }} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Feather name="search" size={20} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('searchRole') || "Search job role..."}
                placeholderTextColor={COLORS.textLight}
                value={roleSearch}
                onChangeText={setRoleSearch}
              />
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {filteredJobRoles
                .filter(role => role.label.toLowerCase().includes(roleSearch.toLowerCase()))
                .map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRoles.includes(role.id);
                  return (
                    <TouchableOpacity
                      key={role.id}
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                        } else {
                          setSelectedRoles([...selectedRoles, role.id]);
                        }
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <View style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: isSelected ? COLORS.primary : COLORS.border,
                          backgroundColor: isSelected ? COLORS.primary : 'transparent',
                          marginRight: 12,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Feather name="check" size={14} color={COLORS.white} />}
                        </View>
                        <Icon size={22} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected, { marginLeft: 12 }]}>
                          {role.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
              <PrimaryButton title={t('done') || "Done"} onPress={() => { setIsRoleModalOpen(false); setRoleSearch(''); }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Type Modal */}
      <Modal
        visible={isBTModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsBTModalOpen(false);
          setBTSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectBusinessType') || 'Select Business Type'}</Text>
              <TouchableOpacity onPress={() => { setIsBTModalOpen(false); setBTSearch(''); }} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Feather name="search" size={20} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('searchBusinessType') || "Search business type..."}
                placeholderTextColor={COLORS.textLight}
                value={btSearch}
                onChangeText={setBTSearch}
              />
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {businessTypes
                .filter(type => type.label.toLowerCase().includes(btSearch.toLowerCase()))
                .map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedBusinessTypes.includes(type.id);
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => {
                        setSelectedBusinessTypes(prev => {
                          if (prev.includes(type.id)) {
                            return prev.filter(id => id !== type.id);
                          } else {
                            return [...prev, type.id];
                          }
                        });
                        setSelectedJobCategories([]);
                        setSelectedRoles([]);
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: isSelected ? COLORS.primary : COLORS.border,
                          backgroundColor: isSelected ? COLORS.primary : 'transparent',
                          marginRight: 12,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Feather name="check" size={14} color={COLORS.white} />}
                        </View>
                        <Icon size={22} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected, { marginLeft: 12 }]}>
                          {type.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={{ padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
              <PrimaryButton title={t('done') || 'Done'} onPress={() => { setIsBTModalOpen(false); setBTSearch(''); }} />
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.footer, isDesktop && styles.desktopFooter, { paddingBottom: 50 }]}>
        {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <PrimaryButton
            title={t('continue')}
            onPress={handleContinue}
            disabled={!isFormValid}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  desktopContent: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  vibrantHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingHorizontal: 24,
    paddingBottom: 80,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  heroTextBox: {
    flex: 1,
  },
  languageLabel: {
    paddingLeft: 25,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginLeft: 4,
  },
  languageLabel1: {
    paddingLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginLeft: 4,
  },
  vibrantTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  vibrantSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '500',
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingWorkspace: {
    marginTop: -40,
    paddingHorizontal: 20,
  },
  islandSurface: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingVertical: 10,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  islandSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  accentRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
  },
  islandSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
    lineHeight: 24,
  },
  vibrantInputRow: {
    marginBottom: 20,
  },
  modernLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginLeft: 4,


  },
  vibrantInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 20,
    minHeight: 60,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  modernTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    marginLeft: 14,
  },
  required: {
    color: COLORS.error,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  apiError: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  desktopFooter: {
    position: 'relative',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 0,
    borderTopWidth: 0,
    paddingBottom: SPACING.xl,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  chipSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  vibrantSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  vibrantSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  vibrantIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  vibrantSelectText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '800',
  },
  labelRowWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vibrantBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  vibrantBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  closeButton: {
    padding: 4,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    margin: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginBottom: 8,
  },
  modalItemSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});