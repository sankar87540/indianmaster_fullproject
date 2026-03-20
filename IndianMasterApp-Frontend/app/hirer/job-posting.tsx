import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Alert, TextInput, Keyboard, KeyboardAvoidingView, Modal } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ChefHat, Utensils, Wrench, User, SprayCan, Bike, ArrowRight, Store, Briefcase, Search, CheckCircle } from 'lucide-react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '@/components/AppHeader';
import PrimaryButton from '@/components/PrimaryButton';
import SalarySlider from '@/components/SalarySlider';
import Slider from '@react-native-community/slider';
import ProgressIndicator from '@/components/ProgressIndicator';
import { COLORS, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import FadeInView from '@/components/FadeInView';

export default function JobPostingScreen() {
  const { t } = useTranslation();
  const { businessType } = useLocalSearchParams<{ businessType: string }>();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedJobCategories, setSelectedJobCategories] = useState<string[]>([]);
  const [workType, setWorkType] = useState<'Full-time' | 'Part-time'>('Full-time');
  const [availability, setAvailability] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  // Map & Location State
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [locality, setLocality] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchTimeout = useRef<any>(null);

  // New Fields State
  const [expMin, setExpMin] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [vacancies, setVacancies] = useState('');
  const [leaves, setLeaves] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [description, setDescription] = useState('');

  // Dropdown Open States
  const [openExpMin, setOpenExpMin] = useState(false);
  const [openVacancies, setOpenVacancies] = useState(false);
  const [openLeaves, setOpenLeaves] = useState(false);
  const [openHours, setOpenHours] = useState(false);

  // Search States for Experience
  const [expMinSearch, setExpMinSearch] = useState('');

  // Search States for Vacancies & Leaves
  const [vacanciesSearch, setVacanciesSearch] = useState('');
  const [leavesSearch, setLeavesSearch] = useState('');
  const [workingHoursSearch, setWorkingHoursSearch] = useState('');

  // Benefits State
  const [benefits, setBenefits] = useState<string[]>([]);

  // --- PERSISTENCE ---
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('jobPostingForm');
        if (savedData) {
          const data = JSON.parse(savedData);
          // NOTE: selectedJobCategories and selectedRoles are NOT restored from storage
          // because they depend on the businessType selected each session.
          // They always start fresh to avoid stale selections from a previous session.
          // if (data.selectedJobCategories) setSelectedJobCategories(data.selectedJobCategories);
          // if (data.selectedRoles) setSelectedRoles(data.selectedRoles);
          if (data.workType) setWorkType(data.workType);
          if (data.availability) setAvailability(data.availability);
          if (data.selectedLanguages) setSelectedLanguages(data.selectedLanguages);
          if (data.city) setCity(data.city);
          if (data.state) setState(data.state);
          if (data.locality) setLocality(data.locality);
          if (data.expMin) setExpMin(data.expMin);
          if (data.salaryMin) setSalaryMin(data.salaryMin);
          if (data.salaryMax) setSalaryMax(data.salaryMax);
          if (data.vacancies) setVacancies(data.vacancies);
          if (data.leaves) setLeaves(data.leaves);
          if (data.workingHours) setWorkingHours(data.workingHours);
          if (data.description) setDescription(data.description);
          if (data.benefits) setBenefits(data.benefits);
        }
      } catch (error) {
        console.error('Error loading job posting form data:', error);
      }
    };
    loadSavedData();
  }, []);

  useEffect(() => {
    const saveFormData = async () => {
      try {
        const formData = {
          workType,
          availability,
          selectedLanguages,
          city,
          state,
          locality,
          expMin,
          salaryMin,
          salaryMax,
          vacancies,
          leaves,
          workingHours,
          description,
          benefits,
        };
        await AsyncStorage.setItem('jobPostingForm', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving job posting form data:', error);
      }
    };
    saveFormData();
  }, [
    workType, availability, selectedLanguages, city, state,
    locality, expMin, salaryMin, salaryMax, vacancies, leaves,
    workingHours, description, benefits
  ]);

  useEffect(() => {
    setSelectedRoles([]);
  }, [selectedJobCategories]);



  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const searchPlaces = async (text: string) => {
    // console.log("--- SEARCH INPUT ---", text); 
    if (text.length > 2) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=5&addressdetails=1`;
      console.log("\n--- FETCHING PLACES ---");
      console.log("URL:", url);

      try {
        const response = await fetch(
          url,
          {
            headers: {
              'User-Agent': 'IndianMasterHiringApp/1.0',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          }
        );

        console.log("STATUS:", response.status);

        if (!response.ok) {
          console.error("!!! HTTP ERROR !!!", response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const textResponse = await response.text();
        // console.log("RAW RESPONSE LENGTH:", textResponse.length);

        try {
          const data = JSON.parse(textResponse);
          console.log("SUGGESTIONS FOUND:", data.length);
          setSuggestions(data);
          setShowPredictions(true);
        } catch (e) {
          console.error("\n!!! JSON PARSE ERROR !!!");
          console.error("Error:", e);
          console.error("Raw Body Start:", textResponse.substring(0, 500)); // Log first 500 chars
          console.error("!!! END ERROR !!!\n");
        }
      } catch (error) {
        console.error("\n!!! NETWORK/FETCH ERROR !!!");
        console.error(error);
        console.error("!!! END ERROR !!!\n");
      }
    } else {
      setSuggestions([]);
      setShowPredictions(false);
    }
  };

  const onPlaceSelect = (place: any) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    setLocality(place.display_name.split(',')[0]); // Use first part of address as locality
    setCity(place.address.city || place.address.town || place.address.village || city);
    setState(place.address.state || state);

    setShowPredictions(false);
    Keyboard.dismiss();
    if (errors.locality) setErrors({ ...errors, locality: '' });
  };




  const ManagementIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-tie" size={size} color={color} />;
  const HousekeepingIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="broom" size={size} color={color} />;
  const FrontOfficeIcon = ({ color, size }: { color: string; size: number }) => <Feather name="monitor" size={size} color={color} />;
  const BarIcon = ({ color, size }: { color: string; size: number }) => <Ionicons name="beer-outline" size={size} color={color} />;
  const PastryIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cupcake" size={size} color={color} />;
  const PurchaseIcon = ({ color, size }: { color: string; size: number }) => <Feather name="shopping-bag" size={size} color={color} />;
  const EngineeringIcon = ({ color, size }: { color: string; size: number }) => <Ionicons name="settings-outline" size={size} color={color} />;
  const TraineeIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-school" size={size} color={color} />;

  // Unused roles removed for cleanup

  const bakeryRoles = [
    { id: 'Bakery Chef', label: t('bakeryChef') || 'Bakery Chef', icon: PastryIcon, cat: 'Bakery' },
    { id: 'Pastry Chef', label: t('pastryChef') || 'Pastry Chef', icon: PastryIcon, cat: 'Bakery' },
    { id: 'Cake Maker', label: t('cakeMaker') || 'Cake Maker', icon: PastryIcon, cat: 'Bakery' },
    { id: 'Sweets Maker', label: t('sweetsMaker') || 'Sweets Maker', icon: PastryIcon, cat: 'Bakery' },
  ];

  const AgriIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="sprout" size={size} color={color} />;
  const LivestockIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cow" size={size} color={color} />;
  const DairyIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="bottle-tonic" size={size} color={color} />;
  const PlantationIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="leaf" size={size} color={color} />;

  // Unused primary production roles removed

  const MeatIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="food-drumstick" size={size} color={color} />;
  const FishIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="fish" size={size} color={color} />;
  const GrainIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="grain" size={size} color={color} />;
  const SnackIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cookie" size={size} color={color} />;
  const FreezerIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="snowflake" size={size} color={color} />;
  const BeverageIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cup" size={size} color={color} />;
  const OilIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="water" size={size} color={color} />;
  const SugarIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cube-outline" size={size} color={color} />;

  const foodProcessingSectors = [
    { id: 'Meat & Poultry Processing', label: t('meatPoultry') || 'Meat & Poultry Processing', icon: MeatIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Seafood Processing', label: t('seafoodProcessing') || 'Seafood Processing', icon: FishIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Dairy Processing', label: t('dairyProcessing') || 'Dairy Processing (Milk, Cheese, Butter, Yogurt)', icon: DairyIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Grain Milling', label: t('grainMilling') || 'Grain Milling (Rice, Flour, Cereals)', icon: GrainIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Bakery & Confectionery Mfg', label: t('bakeryMfg') || 'Bakery & Confectionery', icon: PastryIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Snack Food Manufacturing', label: t('snackFood') || 'Snack Food Manufacturing', icon: SnackIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Frozen & Ready-to-eat Foods', label: t('frozenFoods') || 'Frozen & Ready-to-eat Foods', icon: FreezerIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Beverage Manufacturing', label: t('beverageMfg') || 'Beverage Manufacturing (Soft Drinks, Juices, Alcoholic)', icon: BeverageIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Edible Oils & Fats', label: t('edibleOils') || 'Edible Oils & Fats', icon: OilIcon, dept: 'Food Processing Industry', cat: 'Production' },
    { id: 'Sugar & Sweeteners', label: t('sugarSweeteners') || 'Sugar & Sweeteners', icon: SugarIcon, dept: 'Food Processing Industry', cat: 'Production' },
  ];

  const AdditiveIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="flask-outline" size={size} color={color} />;
  const FlavorIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="flower-tulip-outline" size={size} color={color} />;
  const SpiceIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="chili-mild" size={size} color={color} />;
  const NutraIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="pill" size={size} color={color} />;
  const InfantIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="baby-bottle-outline" size={size} color={color} />;

  // Unused food ingredients roles removed

  // Show filtered roles based on business type
  const PackageIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="package-variant" size={size} color={color} />;
  const ColdIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="snowflake-thermometer" size={size} color={color} />;
  const WarehouseIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="warehouse" size={size} color={color} />;

  // Unused packaging roles removed

  const LabIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="flask" size={size} color={color} />;
  const InspectIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="clipboard-check-outline" size={size} color={color} />;
  const RegIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="shield-check-outline" size={size} color={color} />;

  const qualityRoles = [
    { id: 'Food Testing & Laboratories', label: t('foodTesting') || 'Food Testing & Laboratories', icon: LabIcon, cat: 'Quality' },
    { id: 'Food Safety Inspection & Certification', label: t('foodSafetyInspection') || 'Food Safety Inspection & Certification', icon: InspectIcon, cat: 'Quality' },
    { id: 'Regulatory Authorities & Compliance', label: t('regulatoryCompliance') || 'Regulatory Authorities & Compliance Services', icon: RegIcon, cat: 'Quality' },
  ];

  const SupermarketIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="store" size={size} color={color} />;
  const ConvStoreIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="shopping" size={size} color={color} />;
  const RestaurantIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />;
  const FastFoodIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="hamburger" size={size} color={color} />;
  const CateringIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="food-takeout-box" size={size} color={color} />;
  const DeliveryIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="moped" size={size} color={color} />;

  const retailRoles = [
    { id: 'Supermarkets & Grocery Stores', label: t('supermarkets') || 'Supermarkets & Grocery Stores', icon: SupermarketIcon, cat: 'Service' },
    { id: 'Convenience Stores', label: t('convenienceStores') || 'Convenience Stores', icon: ConvStoreIcon, cat: 'Service' },
    { id: 'Restaurants & Cafes', label: t('restaurantsCafes') || 'Restaurants & Cafés', icon: RestaurantIcon, cat: 'Service' },
    { id: 'Fast Food & QSR Chains', label: t('fastFood') || 'Fast Food & QSR Chains', icon: FastFoodIcon, cat: 'Service' },
    { id: 'Catering & Institutional Food', label: t('cateringInstitutional') || 'Catering & Institutional Food Services', icon: CateringIcon, cat: 'Service' },
    { id: 'Online Food Delivery', label: t('onlineDelivery') || 'Online Food Delivery Platforms', icon: DeliveryIcon, cat: 'Service' },
  ];

  const TruckIcon2 = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="truck-delivery" size={size} color={color} />;
  const WholesaleIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="warehouse" size={size} color={color} />;
  const ImportIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="airplane" size={size} color={color} />;

  const distributionRoles = [
    { id: 'Food Transportation & Logistics', label: t('foodTransportation') || 'Food Transportation & Logistics', icon: TruckIcon2, cat: 'Distribution' },
    { id: 'Wholesale Food Distribution', label: t('wholesaleDistribution') || 'Wholesale Food Distribution', icon: WholesaleIcon, cat: 'Distribution' },
    { id: 'Import & Export of Food Products', label: t('importExportFood') || 'Import & Export of Food Products', icon: ImportIcon, cat: 'Distribution' },
  ];

  const MeatTechIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="tools" size={size} color={color} />;
  const ProductionIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-cog" size={size} color={color} />;
  const OperatorIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-group" size={size} color={color} />;
  const LeaderIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-star" size={size} color={color} />;
  const StoreIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="warehouse" size={size} color={color} />;
  const InventoryIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />;
  const DispatchIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="truck-delivery" size={size} color={color} />;

  // Unused meat and poultry processing roles removed

  const SafetyOfficerIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="shield-check" size={size} color={color} />;
  const QAManagerIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-tie" size={size} color={color} />;
  const QASupervisorIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-search" size={size} color={color} />;

  // Unused quality assurance roles removed

  const ProductionWorkerIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="factory" size={size} color={color} />;
  const ProcessingOperatorIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cog" size={size} color={color} />;
  const LineHelperIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-plus" size={size} color={color} />;
  const CuttingCleaningIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="knife" size={size} color={color} />;
  const MachineHelperIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="robot-industrial" size={size} color={color} />;

  // Unused production processing roles removed

  const ShopIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="store" size={size} color={color} />;

  // Unused supervisory roles removed

  const BroomIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="broom" size={size} color={color} />;
  const BugIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="bug-outline" size={size} color={color} />;
  const WaterIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="water-pump" size={size} color={color} />;

  // Unused utilities sanitation roles removed

  const PurchaseAssistantIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cart-outline" size={size} color={color} />;
  const ProcurementExecutiveIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="briefcase-check-outline" size={size} color={color} />;
  const PurchaseManagerIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-cash-outline" size={size} color={color} />;

  // Unused procurement purchase roles removed

  const ChefHatIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="chef-hat" size={size} color={color} />;
  const PizzaIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="pizza" size={size} color={color} />;
  const CoffeeIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="coffee-outline" size={size} color={color} />;
  const FoodIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="food" size={size} color={color} />;
  const StoveIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="stove" size={size} color={color} />;
  const ToolsIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="tools" size={size} color={color} />;

  const foodProcessingManagementRoles = [
    { id: 'Plant Manager FP', label: t('plantManager') || 'Plant Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Operations Director FP', label: t('operationsDirector') || 'Operations Director', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Production Manager FP', label: t('productionManager') || 'Production Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Factory Manager FP', label: t('factoryManager') || 'Factory Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'R&D Director FP', label: t('rdDirector') || 'R&D Director', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Innovation Manager FP', label: t('innovationManager') || 'Innovation Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Research Manager FP', label: t('researchManager') || 'Research Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Restaurant Manager FP', label: t('restaurantManager') || 'Restaurant Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Bar Manager FP', label: t('barManager') || 'Bar Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'F&B Manager FP', label: t('fbManager') || 'F&B Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Outlet Manager FP', label: t('outletManager') || 'Outlet Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Banquet Manager Mgmt FP', label: t('banquetManager') || 'Banquet Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Human Resource Manager FP', label: t('hrManager') || 'Human Resource Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Supervisor FP', label: t('supervisor') || 'Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Kitchen Manager FP', label: t('kitchenManager') || 'Kitchen Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Catering Manager Mgmt FP', label: t('cateringManager') || 'Catering Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Event Coordinator FP', label: t('eventCoordinator') || 'Event Coordinator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Purchase Manager FP', label: t('purchasingManager') || 'Purchase Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Store Manager FP', label: t('storeManager') || 'Store Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Cost Controller Mgmt FP', label: t('costController') || 'Cost Controller', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Store Incharge FP', label: t('storeIncharge') || 'Store Incharge', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Front Desk Mgmt FP', label: t('frontDesk') || 'Front Desk', icon: FrontOfficeIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Asst Manager FP', label: t('asstManager') || 'Asst Manager', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Housekeeping Manager FP', label: t('housekeepingManager') || 'Housekeeping Manager', icon: HousekeepingIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Cleaning Supervisor FP', label: t('cleaningSupervisor') || 'Cleaning Supervisor', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Chief Accountant FP', label: t('chiefAccountant') || 'Chief Accountant', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Accounting Manager FP', label: t('accountingManager') || 'Accounting Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Parcel Supervisor FP', label: t('parcelSupervisor') || 'Parcel Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Warehouse Manager FP', label: t('warehouseManager') || 'Warehouse Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Operations Manager FP', label: t('operationsManager') || 'Operations Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Shift Supervisor FP', label: t('shiftSupervisor') || 'Shift Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Assistant Store Manager FP', label: t('asstStoreManager') || 'Assistant Store Manager', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Department Manager FP', label: t('departmentManager') || 'Department Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Supplier Relations Manager FP', label: t('supplierRelationsManager') || 'Supplier Relations Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
    { id: 'Procurement Manager FP', label: t('procurementManager') || 'Procurement Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Management' },
  ];

  const foodProcessingProductionRoles = [
    { id: 'Production Supervisor', label: t('productionSupervisor') || 'Production Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Shift Manager', label: t('shiftManager') || 'Shift Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Line Lead', label: t('lineLead') || 'Line Lead', icon: LeaderIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Team Leader', label: t('teamLeader') || 'Team Leader', icon: LeaderIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Line Operator', label: t('lineOperator') || 'Line Operator', icon: OperatorIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Assembly Worker', label: t('assemblyWorker') || 'Assembly Worker', icon: ProductionIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Machine Operator', label: t('machineOperator') || 'Machine Operator', icon: OperatorIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Production Associate', label: t('productionAssociate') || 'Production Associate', icon: ProductionIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Butcher', label: t('butcher') || 'Butcher', icon: MeatTechIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Baker', label: t('baker') || 'Baker', icon: PastryIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Batch Maker', label: t('batchMaker') || 'Batch Maker', icon: ProductionIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Mixer Operator', label: t('mixerOperator') || 'Mixer Operator', icon: OperatorIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
    { id: 'Grinder Operator', label: t('grinderOperator') || 'Grinder Operator', icon: OperatorIcon, dept: 'Food Processing Industry', cat: 'Production / Manufacturing' },
  ];

  const packingRoles = [
    { id: 'Packaging Operator', label: t('packagingOperator') || 'Packaging Operator', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Packing' },
    { id: 'Filler Operator', label: t('fillerOperator') || 'Filler Operator', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Packing' },
    { id: 'Labeling Technician', label: t('labelingTechnician') || 'Labeling Technician', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Packing' },
    { id: 'Sealing Machine Operator', label: t('sealingMachineOperator') || 'Sealing Machine Operator', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Packing' },
  ];

  const qualityControlRoles = [
    { id: 'QC Inspector', label: t('qcInspector') || 'QC Inspector', icon: InspectIcon, dept: 'Food Processing Industry', cat: 'Quality Control' },
    { id: 'Grader', label: t('grader') || 'Grader', icon: InspectIcon, dept: 'Food Processing Industry', cat: 'Quality Control' },
    { id: 'Sorter', label: t('sorter') || 'Sorter', icon: InspectIcon, dept: 'Food Processing Industry', cat: 'Quality Control' },
    { id: 'Tester', label: t('tester') || 'Tester', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Quality Control' },
    { id: 'Quality Technician', label: t('qualityTechnician') || 'Quality Technician', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Quality Control' },
  ];

  const maintenanceEngineeringRoles = [
    { id: 'Maintenance Technician', label: t('maintenanceTechnician') || 'Maintenance Technician', icon: MeatTechIcon, dept: 'Food Processing Industry', cat: 'Maintenance & Engineering' },
    { id: 'Industrial Engineer', label: t('industrialEngineer') || 'Industrial Engineer', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Maintenance & Engineering' },
    { id: 'Refrigeration Technician', label: t('refrigerationTechnician') || 'Refrigeration Technician', icon: ColdIcon, dept: 'Food Processing Industry', cat: 'Maintenance & Engineering' },
    { id: 'Electrical Technician', label: t('electricalTechnician') || 'Electrical Technician', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Maintenance & Engineering' },
    { id: 'Food Process Engineer', label: t('foodProcessEngineer') || 'Food Process Engineer', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Maintenance & Engineering' },
    { id: 'Automation Specialist', label: t('automationSpecialist') || 'Automation Specialist', icon: MachineHelperIcon, dept: 'Food Processing Industry', cat: 'Maintenance & Engineering' },
    { id: 'Facilities Engineer', label: t('facilitiesEngineer') || 'Facilities Engineer', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Maintenance & Engineering' },
  ];

  const sanitisationRoles = [
    { id: 'Sanitation Manager', label: t('sanitationManager') || 'Sanitation Manager', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Sanitisation' },
    { id: 'Clean-in-Place Operator', label: t('cipOperator') || 'Clean-in-Place Operator', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Sanitisation' },
    { id: 'Sanitation Worker', label: t('sanitationWorker') || 'Sanitation Worker', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Sanitisation' },
  ];

  const rdRoles = [
    { id: 'Safety Coordinator', label: t('safetyCoordinator') || 'Safety Coordinator', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Research and Development' },
    { id: 'HACCP Coordinator', label: t('haccpCoordinator') || 'HACCP Coordinator', icon: RegIcon, dept: 'Food Processing Industry', cat: 'Research and Development' },
    { id: 'Compliance Officer', label: t('complianceOfficer') || 'Compliance Officer', icon: RegIcon, dept: 'Food Processing Industry', cat: 'Research and Development' },
    { id: 'Food Scientist', label: t('foodScientist') || 'Food Scientist', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research and Development' },
    { id: 'Product Developer', label: t('productDeveloper') || 'Product Developer', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research and Development' },
    { id: 'Formulation Specialist', label: t('formulationSpecialist') || 'Formulation Specialist', icon: AdditiveIcon, dept: 'Food Processing Industry', cat: 'Research and Development' },
  ];

  const foodScienceRoles = [
    { id: 'Lab Technician', label: t('labTechnician') || 'Lab Technician', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Food Science' },
    { id: 'Microbiologist', label: t('microbiologist') || 'Microbiologist', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Food Science' },
    { id: 'Chemist', label: t('chemist') || 'Chemist', icon: AdditiveIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Food Science' },
    { id: 'Research Chef', label: t('researchChef') || 'Research Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Food Science' },
    { id: 'Innovation Manager', label: t('innovationManager') || 'Innovation Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Food Science' },
    { id: 'Test Kitchen Staff', label: t('testKitchenStaff') || 'Test Kitchen Staff', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Food Science' },
  ];

  const executiveLeadershipRoles = [
    { id: 'Chief Executive Officer (CEO)', label: t('ceo') || 'Chief Executive Officer (CEO)', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Operating Officer (COO)', label: t('coo') || 'Chief Operating Officer (COO)', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Financial Officer (CFO)', label: t('cfo') || 'Chief Financial Officer (CFO)', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Marketing Officer (CMO)', label: t('cmo') || 'Chief Marketing Officer (CMO)', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Revenue Officer', label: t('cro') || 'Chief Revenue Officer', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Executive / Hotel Leadership' },
    { id: 'Regional Director', label: t('regionalDirector') || 'Regional Director', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Executive / Hotel Leadership' },
    { id: 'Area General Manager', label: t('areaGeneralManager') || 'Area General Manager', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Executive / Hotel Leadership' },
  ];

  const frontOfficeMgmtRoles = [
    { id: 'Front Office Manager FP', label: t('frontOfficeManager') || 'Front Office Manager', icon: ManagementIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
    { id: 'Assistant Front Office Manager FP', label: t('asstFrontOfficeManager') || 'Assistant Front Office Manager', icon: ManagementIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
    { id: 'Guest Relations Manager FP', label: t('guestRelationsManager') || 'Guest Relations Manager', icon: ManagementIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
    { id: 'Night Manager FP', label: t('nightManager') || 'Night Manager', icon: ManagementIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
    { id: 'Front Desk Supervisor FP', label: t('frontDeskSupervisor') || 'Front Desk Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
    { id: 'Front Desk Agent FP', label: t('frontDeskAgent') || 'Front Desk Agent', icon: FrontOfficeIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
    { id: 'Guest Service Agent FP', label: t('guestServiceAgent') || 'Guest Service Agent', icon: FrontOfficeIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
    { id: 'Receptionist FP', label: t('receptionist') || 'Receptionist', icon: FrontOfficeIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
    { id: 'Night Auditor FP', label: t('nightAuditor') || 'Night Auditor', icon: FrontOfficeIcon, dept: 'Food Processing Industry', cat: 'Front Office Management' },
  ];

  const TrayIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="tray-full" size={size} color={color} />;
  const DoorIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="door-open" size={size} color={color} />;
  const DishWasherIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="dishwasher" size={size} color={color} />;

  const fbMgmtRoles = [
    { id: 'Banquet catering FP', label: t('banquetCatering') || 'Banquet catering', icon: CateringIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Director of Food & Beverage FP', label: t('directorFB') || 'Director of Food & Beverage', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Assistant Director of Food & Beverage FP', label: t('asstDirectorFB') || 'Assistant Director of Food & Beverage', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'F&B Manager FP', label: t('fbManager') || 'F&B Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Outlet Manager FP', label: t('outletManager') || 'Outlet Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Banquet Manager FP', label: t('banquetManager') || 'Banquet Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Room Service Manager FP', label: t('roomServiceManager') || 'Room Service Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Catering Manager FP', label: t('cateringManager') || 'Catering Manager', icon: CateringIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Bar Manager FP', label: t('barManager') || 'Bar Manager', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Beverage Director FP', label: t('beverageDirector') || 'Beverage Director', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Restaurant Manager FP', label: 'Restaurant Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'F&B Supervisor FP', label: 'F&B Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Head Server FP', label: 'Head Server', icon: TrayIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Head Bartender FP', label: 'Head Bartender', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Banquet Captain FP', label: 'Banquet Captain', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Room Service Supervisor FP', label: 'Room Service Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Banquet Setup Attendant FP', label: 'Banquet Setup Attendant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Banquet Houseman FP', label: 'Banquet Houseman', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Banquet Porter FP', label: 'Banquet Porter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Catering Coordinator FP', label: 'Catering Coordinator', icon: CateringIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Catering Sales Manager FP', label: 'Catering Sales Manager', icon: CateringIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
    { id: 'Event Planner FP', label: 'Event Planner', icon: CateringIcon, dept: 'Food Processing Industry', cat: 'Food & Beverage Management' },
  ];

  const bellServiceRoles = [
    { id: 'Bell Captain FP', label: t('bellCaptain') || 'Bell Captain', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Bell Service / Room Attendant' },
    { id: 'Bell Attendant FP', label: t('bellAttendant') || 'Bell Attendant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Bell Service / Room Attendant' },
    { id: 'Bellman FP', label: t('bellman') || 'Bellman', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Bell Service / Room Attendant' },
    { id: 'Doorman FP', label: t('doorman') || 'Doorman', icon: DoorIcon, dept: 'Food Processing Industry', cat: 'Bell Service / Room Attendant' },
    { id: 'Luggage Porter FP', label: t('luggagePorter') || 'Luggage Porter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Bell Service / Room Attendant' },
    { id: 'Valet Parking Attendant FP', label: t('valetParkingAttendant') || 'Valet Parking Attendant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Bell Service / Room Attendant' },
  ];

  const housekeepingMgmtRoles = [
    { id: 'Executive Housekeeper FP', label: t('executiveHousekeeper') || 'Executive Housekeeper', icon: HousekeepingIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Assistant Executive Housekeeper FP', label: t('asstExecutiveHousekeeper') || 'Assistant Executive Housekeeper', icon: HousekeepingIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Housekeeping Manager FP', label: t('housekeepingManager') || 'Housekeeping Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Laundry Manager FP', label: t('laundryManager') || 'Laundry Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Housekeeping Supervisor FP', label: t('housekeepingSupervisor') || 'Housekeeping Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Floor Supervisor FP', label: t('floorSupervisor') || 'Floor Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Public Area Supervisor FP', label: t('publicAreaSupervisor') || 'Public Area Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Linen Room Supervisor FP', label: t('linenRoomSupervisor') || 'Linen Room Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Room Attendant FP', label: t('roomAttendant') || 'Room Attendant', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Houseman FP', label: t('houseman') || 'Houseman', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Turndown Attendant FP', label: t('turndownAttendant') || 'Turndown Attendant', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Laundry Attendant FP', label: t('laundryAttendant') || 'Laundry Attendant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Laundry Worker FP', label: t('laundryWorker') || 'Laundry Worker', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Valet Runner FP', label: t('valetRunner') || 'Valet Runner', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Dry Cleaner FP', label: t('dryCleaner') || 'Dry Cleaner', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
    { id: 'Seamstress/Tailor FP', label: t('seamstressTailor') || 'Seamstress/Tailor', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Housekeeping Management/Laundry' },
  ];

  const kitchenBarStaffRoles = [
    { id: 'Executive Chef FP', label: t('executiveChef') || 'Executive Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
    { id: 'Sous Chef FP', label: t('sousChef') || 'Sous Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
    { id: 'Chef de Partie FP', label: t('chefDePartie') || 'Chef de Partie', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
    { id: 'Line Cook FP', label: t('lineCook') || 'Line Cook', icon: StoveIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
    { id: 'Prep Cook FP', label: t('prepCook') || 'Prep Cook', icon: StoveIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
    { id: 'Pastry Chef FP', label: t('pastryChef') || 'Pastry Chef', icon: PastryIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
    { id: 'Banquet Chef FP', label: t('banquetChef') || 'Banquet Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
    { id: 'Kitchen Steward FP', label: t('kitchenSteward') || 'Kitchen Steward', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
    { id: 'Dishwasher FP', label: t('dishwasher') || 'Dishwasher', icon: DishWasherIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Bar Staff' },
  ];

  const serviceStaffRoles = [
    { id: 'Server/Waiter FP', label: t('serviceWaiter') || 'Server/Waiter', icon: TrayIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Banquet Server FP', label: t('banquetServer') || 'Banquet Server', icon: TrayIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Cocktail Server FP', label: t('cocktailServer') || 'Cocktail Server', icon: TrayIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Busser FP', label: t('busser') || 'Busser', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Food Runner FP', label: t('foodRunner') || 'Food Runner', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Room Service Attendant FP', label: t('roomServiceAttendant') || 'Room Service Attendant', icon: TrayIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'In-Room Dining Server FP', label: t('inRoomDiningServer') || 'In-Room Dining Server', icon: TrayIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Bartender FP', label: t('bartender') || 'Bartender', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Barback FP', label: t('barback') || 'Barback', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Sommelier FP', label: t('sommelier') || 'Sommelier', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Barista FP', label: t('barista') || 'Barista', icon: CoffeeIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Cocktail Mixologist FP', label: t('cocktailMixologist') || 'Cocktail Mixologist', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Host/Hostess FP', label: t('hostHostess') || 'Host/Hostess', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Greeter FP', label: t('greeter') || 'Greeter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Banquet Setup Attendant SS FP', label: t('banquetSetupAttendant') || 'Banquet Setup Attendant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Banquet Houseman SS FP', label: t('banquetHouseman') || 'Banquet Houseman', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
    { id: 'Banquet Porter SS FP', label: t('banquetPorter') || 'Banquet Porter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Service Staff' },
  ];

  const salesMarketingRoles = [
    { id: 'Director of Sales & Marketing FP', label: t('directorSalesMarketing') || 'Director of Sales & Marketing', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Sales FP', label: t('directorSales') || 'Director of Sales', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Marketing FP', label: t('directorMarketing') || 'Director of Marketing', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Revenue Management FP', label: t('directorRevenueManagement') || 'Director of Revenue Management', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Manager FP', label: t('salesManager') || 'Sales Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Marketing Manager FP', label: t('marketingManager') || 'Marketing Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Digital Marketing Manager FP', label: t('digitalMarketingManager') || 'Digital Marketing Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Social Media Manager FP', label: t('socialMediaManager') || 'Social Media Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Communications Manager FP', label: t('communicationsManager') || 'Communications Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Brand Manager FP', label: t('brandManager') || 'Brand Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Executive FP', label: t('salesExecutive') || 'Sales Executive', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Corporate Sales Manager FP', label: t('corporateSalesManager') || 'Corporate Sales Manager', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Leisure Sales Manager FP', label: t('leisureSalesManager') || 'Leisure Sales Manager', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Group Sales Manager FP', label: t('groupSalesManager') || 'Group Sales Manager', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Wedding Sales Manager FP', label: t('weddingSalesManager') || 'Wedding Sales Manager', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Conference Sales Manager FP', label: t('conferenceSalesManager') || 'Conference Sales Manager', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Coordinator FP', label: t('salesCoordinator') || 'Sales Coordinator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Catering Sales Manager SM FP', label: t('cateringSalesManager') || 'Catering Sales Manager', icon: CateringIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Marketing Coordinator FP', label: t('marketingCoordinator') || 'Marketing Coordinator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Content Creator FP', label: t('contentCreator') || 'Content Creator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Graphic Designer FP', label: t('graphicDesigner') || 'Graphic Designer', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Public Relations Manager FP', label: t('prManager') || 'Public Relations Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'SEO Specialist FP', label: t('seoSpecialist') || 'SEO Specialist', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'E-commerce Manager FP', label: t('ecommerceManager') || 'E-commerce Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Website Manager FP', label: t('websiteManager') || 'Website Manager', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Online Reputation Manager FP', label: t('onlineReputationManager') || 'Online Reputation Manager', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Sales & Marketing / Digital Sales' },
  ];

  const securityMaintenanceRoles = [
    { id: 'Maintenance Manager FP', label: t('maintenanceManager') || 'Maintenance Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Engineering Supervisor FP', label: t('engineeringSupervisor') || 'Engineering Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Maintenance Technician SM FP', label: t('maintenanceTechnician') || 'Maintenance Technician', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'General Maintenance FP', label: t('generalMaintenance') || 'General Maintenance', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'HVAC Technician FP', label: t('hvacTechnician') || 'HVAC Technician', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Electrician FP', label: t('electrician') || 'Electrician', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Plumber FP', label: t('plumber') || 'Plumber', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Carpenter FP', label: t('carpenter') || 'Carpenter', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Painter FP', label: t('painter') || 'Painter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Pool Maintenance Technician FP', label: t('poolMaintenanceTechnician') || 'Pool Maintenance Technician', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Refrigeration Technician SM FP', label: t('refrigerationTechnician') || 'Refrigeration Technician', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Handyman FP', label: t('handyman') || 'Handyman', icon: EngineeringIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Landscaper FP', label: t('landscaper') || 'Landscaper', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Groundskeeper FP', label: t('groundskeeper') || 'Groundskeeper', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Gardener FP', label: t('gardener') || 'Gardener', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Director of Security FP', label: t('directorSecurity') || 'Director of Security', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Security Manager FP', label: t('securityManager') || 'Security Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Security Supervisor FP', label: t('securitySupervisor') || 'Security Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Security Officer FP', label: t('securityOfficer') || 'Security Officer', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Patrol Officer FP', label: t('patrolOfficer') || 'Patrol Officer', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Loss Prevention Officer FP', label: t('lossPreventionOfficer') || 'Loss Prevention Officer', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'CCTV Operator FP', label: t('cctvOperator') || 'CCTV Operator', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
    { id: 'Night Security Guard FP', label: t('nightSecurityGuard') || 'Night Security Guard', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Security & Maintenance' },
  ];

  const adminHrFinanceRoles = [
    { id: 'Director of Human Resources FP', label: t('directorHR') || 'Director of Human Resources', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'HR Manager FP', label: t('hrManager') || 'HR Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Talent Acquisition Manager FP', label: t('talentAcquisitionManager') || 'Talent Acquisition Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Training Manager FP', label: t('trainingManager') || 'Training Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Recruiter FP', label: t('recruiter') || 'Recruiter', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Talent Acquisition Specialist FP', label: t('talentAcquisitionSpecialist') || 'Talent Acquisition Specialist', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'HR Generalist FP', label: t('hrGeneralist') || 'HR Generalist', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'HR Coordinator FP', label: t('hrCoordinator') || 'HR Coordinator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'HR Assistant FP', label: t('hrAssistant') || 'HR Assistant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Director of Finance FP', label: t('directorFinance') || 'Director of Finance', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Finance Manager FP', label: t('financeManager') || 'Finance Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Accounting Manager FP', label: t('accountingManager') || 'Accounting Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Assistant Controller FP', label: t('asstController') || 'Assistant Controller', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Staff Accountant FP', label: t('staffAccountant') || 'Staff Accountant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Accounts Payable Clerk FP', label: t('accountsPayableClerk') || 'Accounts Payable Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Accounts Receivable Clerk FP', label: t('accountsReceivableClerk') || 'Accounts Receivable Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'General Cashier FP', label: t('generalCashier') || 'General Cashier', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Income Auditor FP', label: t('incomeAuditor') || 'Income Auditor', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Night Auditor Admin FP', label: t('nightAuditor') || 'Night Auditor', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Payroll Clerk FP', label: t('payrollClerk') || 'Payroll Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Cost Controller FP', label: t('costController') || 'Cost Controller', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Food & Beverage Controller FP', label: t('fbController') || 'Food & Beverage Controller', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Purchasing Manager FP', label: t('purchasingManager') || 'Purchasing Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Purchasing Clerk FP', label: t('purchasingClerk') || 'Purchasing Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Receiving Clerk FP', label: t('receivingClerk') || 'Receiving Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Inventory Controller FP', label: t('inventoryController') || 'Inventory Controller', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
    { id: 'Credit Manager FP', label: t('creditManager') || 'Credit Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Admin / HR / Finance / Purchase' },
  ];

  const itRoles = [
    { id: 'Director of IT FP', label: t('directorIT') || 'Director of IT', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'IT Manager FP', label: t('itManager') || 'IT Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'Systems Manager FP', label: t('systemsManager') || 'Systems Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'IT Support Specialist FP', label: t('itSupportSpecialist') || 'IT Support Specialist', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'Help Desk Technician FP', label: t('helpDeskTechnician') || 'Help Desk Technician', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'Network Administrator FP', label: t('networkAdministrator') || 'Network Administrator', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'Systems Administrator FP', label: t('systemsAdministrator') || 'Systems Administrator', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'Database Administrator FP', label: t('databaseAdministrator') || 'Database Administrator', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'Web Developer FP', label: t('webDeveloper') || 'Web Developer', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'IT' },
    { id: 'Software Developer FP', label: t('softwareDeveloper') || 'Software Developer', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'IT' },
  ];

  const productDevelopmentRoles = [
    { id: 'Product Developer FP', label: t('productDeveloper') || 'Product Developer', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Product Development' },
    { id: 'R&D Chef FP', label: t('rdChef') || 'R&D Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Product Development' },
    { id: 'Culinary Developer FP', label: t('culinaryDirector') || 'Culinary Developer', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Product Development' },
    { id: 'Application Specialist FP', label: t('applicationSpecialist') || 'Application Specialist', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Product Development' },
  ];

  const researchLabRoles = [
    { id: 'Food Scientist RL FP', label: t('foodScientist') || 'Food Scientist', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Flavor Chemist FP', label: t('flavorChemist') || 'Flavor Chemist', icon: AdditiveIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Texture Specialist FP', label: t('textureSpecialist') || 'Texture Specialist', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Ingredient Specialist FP', label: t('additiveSpecialist') || 'Ingredient Specialist', icon: AdditiveIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Recipe Formulator FP', label: t('recipeTester') || 'Recipe Formulator', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Nutritionist FP', label: t('nutritionist') || 'Nutritionist', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Product Formulator FP', label: t('labTechnician') || 'Product Formulator', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Sensory Analyst FP', label: t('qcInspector') || 'Sensory Analyst', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Taste Tester FP', label: t('tester') || 'Taste Tester', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Consumer Researcher FP', label: t('researcher') || 'Consumer Researcher', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Panel Leader FP', label: t('supervisor') || 'Panel Leader', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Lab Technician RL FP', label: t('labTechnician') || 'Lab Technician', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Research Associate FP', label: t('researchManager') || 'Research Associate', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Food Microbiologist FP', label: t('microbiologist') || 'Food Microbiologist', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
    { id: 'Analytical Chemist FP', label: t('chemist') || 'Analytical Chemist', icon: AdditiveIcon, dept: 'Food Processing Industry', cat: 'Research & Laboratory' },
  ];

  const foodSafetyQARoles = [
    { id: 'Food Safety Specialist FP', label: t('foodSafetySpecialist') || 'Food Safety Specialist', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Quality Assurance' },
    { id: 'HACCP Coordinator QA FP', label: t('haccpCoordinator') || 'HACCP Coordinator', icon: RegIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Quality Assurance' },
    { id: 'Sanitarian FP', label: t('sanitationWorker') || 'Sanitarian', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Quality Assurance' },
    { id: 'QA Manager FP', label: t('qaManager') || 'QA Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Quality Assurance' },
    { id: 'Quality Systems Coordinator FP', label: t('qualitySystemsCoordinator') || 'Quality Systems Coordinator', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Food Safety & Quality Assurance' },
  ];

  const educationConsultantRoles = [
    { id: 'Culinary Instructor FP', label: t('culinaryInstructor') || 'Culinary Instructor', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Cooking Teacher FP', label: t('cookingTeacher') || 'Cooking Teacher', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Food Safety Trainer FP', label: t('foodSafetyTrainer') || 'Food Safety Trainer', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Corporate Trainer FP', label: t('corporateTrainer') || 'Corporate Trainer', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Food Business Consultant FP', label: t('foodBusinessConsultant') || 'Food Business Consultant', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Restaurant Consultant FP', label: t('restaurantConsultant') || 'Restaurant Consultant', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Menu Engineer FP', label: t('menuEngineer') || 'Menu Engineer', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Sustainability Consultant FP', label: t('sustainabilityConsultant') || 'Sustainability Consultant', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Food Attorney FP', label: t('foodAttorney') || 'Food Attorney', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
    { id: 'Regulatory Consultant FP', label: t('regulatoryConsultant') || 'Regulatory Consultant', icon: RegIcon, dept: 'Food Processing Industry', cat: 'Education & Consultant' },
  ];

  const compliancesRoles = [
    { id: 'Regulatory Affairs Specialist FP', label: t('regulatoryAffairs') || 'Regulatory Affairs Specialist', icon: RegIcon, dept: 'Food Processing Industry', cat: 'Compliances' },
    { id: 'Compliance Officer FP', label: t('complianceOfficer') || 'Compliance Officer', icon: SafetyOfficerIcon, dept: 'Food Processing Industry', cat: 'Compliances' },
    { id: 'Labeling Specialist FP', label: t('labelingTechnician') || 'Labeling Specialist', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Compliances' },
  ];

  const itPhotographyRoles = [
    { id: 'Food Writer FP', label: t('foodWriter') || 'Food Writer', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'IT & Photography' },
    { id: 'Food Blogger FP', label: t('foodBlogger') || 'Food Blogger', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'IT & Photography' },
    { id: 'Content Creator IT FP', label: t('contentCreator') || 'Content Creator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'IT & Photography' },
    { id: 'Food Photographer FP', label: t('foodPhotographer') || 'Food Photographer', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'IT & Photography' },
    { id: 'Food Stylist FP', label: t('foodStylist') || 'Food Stylist', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'IT & Photography' },
    { id: 'Food Brand Manager FP', label: t('brandManager') || 'Food Brand Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'IT & Photography' },
    { id: 'Social Media Specialist FP', label: t('socialMediaManager') || 'Social Media Specialist', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'IT & Photography' },
  ];

  const adminAccountantRoles = [
    { id: 'Cashier FP', label: t('cashier') || 'Cashier', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
    { id: 'Billing FP', label: t('billing') || 'Billing', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
    { id: 'Admin Assistant FP', label: t('adminAssistant') || 'Admin Assistant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
    { id: 'Receptionist Admin FP', label: t('receptionist') || 'Receptionist', icon: FrontOfficeIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
    { id: 'HR Assistant Admin FP', label: t('hrAssistant') || 'HR Assistant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
    { id: 'Clerk FP', label: t('clerk') || 'Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
    { id: 'Data Entry FP', label: t('dataEntry') || 'Data Entry', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
    { id: 'Store Assistant FP', label: t('storeAssistant') || 'Store Assistant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
    { id: 'Purchase Assistant FP', label: t('purchaseAssistant') || 'Purchase Assistant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Admin / Accountant' },
  ];

  const purchaseStoreRoles = [
    { id: 'Service/Waiter PS FP', label: t('serviceWaiter') || 'Service/Waiter', icon: TrayIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Food Runner PS FP', label: t('foodRunner') || 'Food Runner', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Captain PS FP', label: t('captain') || 'Captain', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Bar Tender PS FP', label: t('barTender') || 'Bar Tender', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Bar Back PS FP', label: t('barBack') || 'Bar Back', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Sommelier/Wine Steward PS FP', label: t('sommelierWineSteward') || 'Sommelier/Wine Steward', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Mixologist PS FP', label: t('mixologist') || 'Mixologist', icon: BarIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Barista PS FP', label: t('barista') || 'Barista', icon: CoffeeIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Greeter PS FP', label: t('greeter') || 'Greeter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Reservationist PS FP', label: t('reservationist') || 'Reservationist', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Counter/Parcel PS FP', label: t('counterParcel') || 'Counter/Parcel', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Buffet Attendant PS FP', label: t('buffetAttendant') || 'Buffet Attendant', icon: TrayIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
    { id: 'Event Planner PS FP', label: t('eventPlanner') || 'Event Planner', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Purchase / Store' },
  ];

  const kitchenOperationRoles = [
    { id: 'Executive Chef KO FP', label: t('executiveChef') || 'Executive Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Corporate Chef KO FP', label: t('corporateChef') || 'Corporate Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Sous Chef KO FP', label: t('sousChef') || 'Sous Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Culinary Director KO FP', label: t('culinaryDirector') || 'Culinary Director', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: "Maitre d'KO FP", label: t('maitred') || "Maitre d'", icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Chef de Cuisine KO FP', label: t('chefDeCuisine') || 'Chef de Cuisine', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Commis 1 KO FP', label: t('commis1') || 'Commis 1', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Commis 2 KO FP', label: t('commis2') || 'Commis 2', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Commis 3 KO FP', label: t('commis3') || 'Commis 3', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Line Cook KO FP', label: t('lineCook') || 'Line Cook', icon: StoveIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Fry Cook KO FP', label: t('fryCook') || 'Fry Cook', icon: StoveIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Pantry Cook KO FP', label: t('pantryCook') || 'Pantry Cook', icon: StoveIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Pantry Chef KO FP', label: t('pantryChef') || 'Pantry Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Pizza Chef KO FP', label: t('pizzaChef') || 'Pizza Chef', icon: PizzaIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Sushi Chef KO FP', label: t('sushiChef') || 'Sushi Chef', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Kitchen Assistant KO FP', label: t('kitchenAssistant') || 'Kitchen Assistant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Vegetable Cutter KO FP', label: t('vegetableCutter') || 'Vegetable Cutter', icon: CuttingCleaningIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Kitchen Porter KO FP', label: t('kitchenPorter') || 'Kitchen Porter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Banquet Chef KO FP', label: t('banquetChef') || 'Banquet Chef', icon: ChefHatIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Chinese Master KO FP', label: t('chineseChef') || 'Chinese Master', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Tandoori/Grill Chef KO FP', label: t('tandoorChef') || 'Tandoori/Grill Chef', icon: StoveIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'South Indian Cook KO FP', label: t('southIndianChef') || 'South Indian Cook', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'North Indian Cook KO FP', label: t('northIndianChef') || 'North Indian Cook', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Continental Cook KO FP', label: t('continentalCook') || 'Continental Cook', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Recipe Tester KO FP', label: t('recipeTester') || 'Recipe Tester', icon: LabIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Sweet Master KO FP', label: t('sweetsMaker') || 'Sweet Master', icon: PastryIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Savouries Master KO FP', label: t('snacksMaster') || 'Savouries Master', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Bakery Master KO FP', label: t('bakeryChef') || 'Bakery Master', icon: PastryIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Chocolate Artist KO FP', label: t('chocolateArtist') || 'Chocolate Artist', icon: PastryIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Tea Master KO FP', label: t('teaMaster') || 'Tea Master', icon: CoffeeIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Juice Master KO FP', label: t('juiceMaker') || 'Juice Master', icon: CoffeeIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Vada/Bujji/Bonda Master KO FP', label: t('vadaBujjiBondaMaster') || 'Vada/Bujji/Bonda Master', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Chat Master KO FP', label: t('chatsMaker') || 'Chat Master', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Dosa/Parotta Master KO FP', label: t('dosaMaster') || 'Dosa/Parotta Master', icon: FoodIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
    { id: 'Kitchen Helper KO FP', label: t('kitchenHelper') || 'Kitchen Helper', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Kitchen / Operation' },
  ];

  const cleaningMaintenanceRoles = [
    { id: 'Dishwashing CM FP', label: t('dishwasher') || 'Dishwashing', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Cleaning / Maintenance' },
    { id: 'Kitchen Cleaning CM FP', label: t('kitchenCleaning') || 'Kitchen Cleaning', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Cleaning / Maintenance' },
    { id: 'RestRoom Cleaning CM FP', label: t('restRoomCleaning') || 'RestRoom Cleaning', icon: BroomIcon, dept: 'Food Processing Industry', cat: 'Cleaning / Maintenance' },
    { id: 'Electrician/Plumber CM FP', label: t('electricianPlumber') || 'Electrician/Plumber', icon: ToolsIcon, dept: 'Food Processing Industry', cat: 'Cleaning / Maintenance' },
  ];

  const procurementPurchaseRoles = [
    { id: 'Buyer Purchasing Agent FP', label: t('procurementManager') || 'Buyer Purchasing Agent', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Procurement / Purchase' },
    { id: 'Sourcing Specialist FP', label: t('supplierRelationsManager') || 'Sourcing Specialist', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Procurement / Purchase' },
    { id: 'Vendor Coordinator FP', label: t('vendorRelationship') || 'Vendor Coordinator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Procurement / Purchase' },
    { id: 'Frozen Food Specialist FP', label: t('foodScientist') || 'Frozen Food Specialist', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Procurement / Purchase' },
  ];

  const warehouseInventoryRoles = [
    { id: 'Forklift Operator FP', label: t('machineOperator') || 'Forklift Operator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Order Picker FP', label: t('orderPicker') || 'Order Picker', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Palletizer FP', label: t('packagingOperator') || 'Palletizer', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Reach Truck Operator FP', label: t('machineOperator') || 'Reach Truck Operator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Receiver FP', label: t('receiving') || 'ReceiverIcon', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Dock Worker FP', label: t('warehouseManager') || 'Dock Worker', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Unloader FP', label: t('unloader') || 'Unloader', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Checker FP', label: t('qcInspector') || 'Checker', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Shipper FP', label: t('dispatchExecutive') || 'Shipper', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Loader FP', label: t('loader') || 'Loader', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Dispatch Coordinator FP', label: t('dispatchCoordinator') || 'Dispatch Coordinator', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Inventory Clerk FP', label: t('inventoryClerk') || 'Inventory Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Cycle Counter FP', label: t('cycleCounter') || 'Cycle Counter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
    { id: 'Stock Keeper FP', label: t('stockKeeper') || 'Stock Keeper', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Warehouse / Inventory' },
  ];

  const logisticsSupplyChainRoles = [
    { id: 'Truck Driver (CDL) FP', label: t('truckDriver') || 'Truck Driver (CDL)', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Delivery Driver FP', label: t('deliveryStaff') || 'Delivery Driver', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Route Driver FP', label: t('deliveryStaff') || 'Route Driver', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Box Truck Driver FP', label: t('deliveryStaff') || 'Box Truck Driver', icon: PackageIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Fleet Manager FP', label: t('fleetManager') || 'Fleet Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Dispatcher FP', label: t('dispatcher') || 'Dispatcher', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Route Planner FP', label: t('routePlanner') || 'Route Planner', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Fleet Maintenance Supervisor FP', label: t('fleetMaintenanceSupervisor') || 'Fleet Maintenance Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Refrigeration Technician Logistics FP', label: t('refrigerationTechnician') || 'Refrigeration Technician', icon: ToolsIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Temperature Monitor FP', label: t('qualityTechnician') || 'Temperature Monitor', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Cold Room Supervisor FP', label: t('coldRoomSupervisor') || 'Cold Room Supervisor', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Logistics Coordinator FP', label: t('logisticsCoordinator') || 'Logistics Coordinator', icon: QASupervisorIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Traffic Manager FP', label: t('trafficManager') || 'Traffic Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Freight Broker FP', label: t('freightBroker') || 'Freight Broker', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Import/Export Coordinator FP', label: t('importExportCoordinator') || 'Import/Export Coordinator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Supply Chain Planner FP', label: t('supplyChainPlanner') || 'Supply Chain Planner', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Demand Planner FP', label: t('demandPlanner') || 'Demand Planner', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
    { id: 'Replenishment Analyst FP', label: t('replenishmentAnalyst') || 'Replenishment Analyst', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Logistics and supply chain' },
  ];

  const foodProcessingRoles = [
    ...foodProcessingManagementRoles,
    ...foodProcessingProductionRoles,
    ...packingRoles,
    ...qualityControlRoles,
    ...maintenanceEngineeringRoles,
    ...sanitisationRoles,
    ...rdRoles,
    ...foodScienceRoles,
    ...executiveLeadershipRoles,
    ...frontOfficeMgmtRoles,
    ...fbMgmtRoles,
    ...bellServiceRoles,
    ...housekeepingMgmtRoles,
    ...kitchenBarStaffRoles,
    ...serviceStaffRoles,
    ...salesMarketingRoles,
    ...securityMaintenanceRoles,
    ...adminHrFinanceRoles,
    ...itRoles,
    ...productDevelopmentRoles,
    ...researchLabRoles,
    ...foodSafetyQARoles,
    ...educationConsultantRoles,
    ...compliancesRoles,
    ...itPhotographyRoles,
    ...adminAccountantRoles,
    ...purchaseStoreRoles,
    ...kitchenOperationRoles,
    ...cleaningMaintenanceRoles,
    ...procurementPurchaseRoles,
    ...warehouseInventoryRoles,
    ...logisticsSupplyChainRoles,
  ];

  const customerServiceSalesRoles = [
    { id: 'Sales Associate FP CS', label: t('salesAssociate') || 'Sales Associate', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Customer service and Sales' },
    { id: 'Stock Clerk FP CS', label: t('stockClerk') || 'Stock Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Customer service and Sales' },
    { id: 'Shelf Stocker FP CS', label: t('shelfStocker') || 'Shelf Stocker', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Customer service and Sales' },
    { id: 'Merchandiser FP CS', label: t('merchandiser') || 'Merchandiser', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Customer service and Sales' },
    { id: 'Customer Service Representative FP CS', label: t('customerServiceRep') || 'Customer Service Representative', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Customer service and Sales' },
    { id: 'Greeter FP CS', label: t('greeter') || 'Greeter', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Customer service and Sales' },
    { id: 'Information Desk Clerk FP CS', label: t('infoDeskClerk') || 'Information Desk Clerk', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Customer service and Sales' },
  ];

  const ecommerceDigitalRoles = [
    { id: 'E-commerce Manager FP', label: t('ecommerceManager') || 'E-commerce Manager', icon: QAManagerIcon, dept: 'Food Processing Industry', cat: 'Ecommerce & Digital' },
    { id: 'Online Order Picker FP', label: t('onlineOrderPicker') || 'Online Order Picker', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Ecommerce & Digital' },
    { id: 'Curbside Attendant FP', label: t('curbsideAttendant') || 'Curbside Attendant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Ecommerce & Digital' },
    { id: 'Personal Shopper FP', label: t('personalShopper') || 'Personal Shopper', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Ecommerce & Digital' },
    { id: 'Online Merchandiser FP', label: t('onlineMerchandiser') || 'Online Merchandiser', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Ecommerce & Digital' },
    { id: 'Product Lister FP', label: t('productLister') || 'Product Lister', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Ecommerce & Digital' },
    { id: 'Content Creator Ecommerce FP', label: t('contentCreator') || 'Content Creator', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Ecommerce & Digital' },
  ];

  const qualityFoodProcessingRoles = [
    { id: 'Food Safety Auditor FP', label: t('foodSafetyAuditor') || 'Food Safety Auditor', icon: InspectIcon, dept: 'Food Processing Industry', cat: 'Quality' },
    { id: 'Quality Inspector FP', label: t('qualityInspector') || 'Quality Inspector', icon: InspectIcon, dept: 'Food Processing Industry', cat: 'Quality' },
  ];

  const accountsRoles = [
    { id: 'Cashier FP Accounts', label: t('cashier') || 'Cashier', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Accounts' },
    { id: 'Accountant FP Accounts', label: t('accountant') || 'Accountant', icon: LineHelperIcon, dept: 'Food Processing Industry', cat: 'Accounts' },
  ];

  foodProcessingRoles.push(...customerServiceSalesRoles, ...ecommerceDigitalRoles, ...qualityFoodProcessingRoles, ...accountsRoles);

  const kitchenRoles = [
    { id: 'Executive Chef / Head Chef', label: t('executiveChef') || 'Executive Chef / Head Chef', icon: ChefHatIcon, cat: 'Kitchen' },
    { id: 'Sous Chef – Second-in-command', label: t('sousChef') || 'Sous Chef', icon: ChefHatIcon, cat: 'Kitchen' },
    { id: 'Chef de Cuisine – Senior chef', label: t('chefDeCuisine') || 'Chef de Cuisine', icon: ChefHatIcon, cat: 'Kitchen' },
    { id: 'Specialty Cuisine Chef', label: t('specialtyChef') || 'Specialty Cuisine Chef', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'South Indian chef', label: t('southIndianChef') || 'South Indian chef', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'North Indian chef', label: t('northIndianChef') || 'North Indian chef', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'Chinese Chef/ Master/ Teacher', label: t('chineseChef') || 'Chinese Chef', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'Pastry Chef', label: t('pastryChef') || 'Pastry Chef', icon: ChefHatIcon, cat: 'Kitchen' },
    { id: 'Bakery Chef', label: t('bakeryChef') || 'Bakery Chef', icon: ChefHatIcon, cat: 'Kitchen' },
    { id: 'Tandoor/ Grill chef', label: t('tandoorChef') || 'Tandoor/ Grill chef', icon: StoveIcon, cat: 'Kitchen' },
    { id: 'Briani Chef', label: t('biryaniChef') || 'Biryani Chef', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'Commis Chef (Commi 1 / Commi 2)', label: t('commisChef') || 'Commis Chef', icon: ChefHatIcon, cat: 'Kitchen' },
    { id: 'Pizza Maker', label: t('pizzaMaker') || 'Pizza Maker', icon: PizzaIcon, cat: 'Kitchen' },
    { id: 'Chats Maker', label: t('chatsMaker') || 'Chats Maker', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'Line Cook', label: t('lineCook') || 'Line Cook', icon: StoveIcon, cat: 'Kitchen' },
    { id: 'Kitchen Supervisor / Kitchen In-Charge', label: t('kitchenSupervisor') || 'Kitchen Supervisor', icon: QAManagerIcon, cat: 'Kitchen' },
    { id: 'Kitchen Staff / Kitchen Helper', label: t('kitchenHelper') || 'Kitchen Staff / Kitchen Helper', icon: LineHelperIcon, cat: 'Kitchen' },
    { id: 'Steward / Kitchen Steward', label: t('steward') || 'Steward / Kitchen Steward', icon: LineHelperIcon, cat: 'Kitchen' },
    { id: 'Parotta Master / Maker', label: t('parottaMaster') || 'Parotta Master', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'Dosa Master / Maker', label: t('dosaMaster') || 'Dosa Master', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'Snacks Master', label: t('snacksMaster') || 'Snacks Master', icon: FoodIcon, cat: 'Kitchen' },
    { id: 'Pantry', label: t('pantry') || 'Pantry', icon: ShopIcon, cat: 'Kitchen' },
    { id: 'Juice Maker', label: t('juiceMaker') || 'Juice Maker', icon: CoffeeIcon, cat: 'Kitchen' },
    { id: 'Tea Master', label: t('teaMaster') || 'Tea Master', icon: CoffeeIcon, cat: 'Kitchen' },
    { id: 'Kitchen Equipment Technician', label: t('kitchenTechnician') || 'Kitchen Equipment Technician', icon: ToolsIcon, cat: 'Kitchen' },
    { id: 'Kitchen Porter', label: t('kitchenPorter') || 'Kitchen Porter', icon: LineHelperIcon, cat: 'Kitchen' },
    { id: 'Kitchen Manager', label: t('kitchenManager') || 'Kitchen Manager', icon: QAManagerIcon, cat: 'Kitchen' },
  ];

  const CocktailIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="glass-cocktail" size={size} color={color} />;
  const WineIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="glass-wine" size={size} color={color} />;
  const FemaleIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="account-tie-woman" size={size} color={color} />;

  const fbServiceRoles = [
    { id: 'Restaurant Manager', label: t('restaurantManager') || 'Restaurant Manager', icon: QAManagerIcon, cat: 'Service' },
    { id: 'Restaurant Captain', label: t('restaurantCaptain') || 'Restaurant Captain', icon: QASupervisorIcon, cat: 'Service' },
    { id: 'F&B Manager / F&B Executive', label: t('fbManager') || 'F&B Manager / F&B Executive', icon: QAManagerIcon, cat: 'Service' },
    { id: 'Floor Manager / Floor supervisor', label: t('floorManager') || 'Floor Manager / Floor supervisor', icon: QASupervisorIcon, cat: 'Service' },
    { id: 'Banquet Manager', label: t('banquetManager') || 'Banquet Manager', icon: QAManagerIcon, cat: 'Service' },
    { id: 'Bar Manager', label: t('barManager') || 'Bar Manager', icon: CocktailIcon, cat: 'Service' },
    { id: 'Bell Captain', label: t('bellCaptain') || 'Bell Captain', icon: QASupervisorIcon, cat: 'Service' },
    { id: 'Senior Captain', label: t('seniorCaptain') || 'Senior Captain', icon: QASupervisorIcon, cat: 'Service' },
    { id: 'Waiter / Server', label: t('waiterServer') || 'Waiter / Server', icon: TrayIcon, cat: 'Service' },
    { id: 'Waitress', label: t('waitress') || 'Waitress', icon: FemaleIcon, cat: 'Service' },
    { id: 'Steward', label: t('stewardRole') || 'Steward', icon: TrayIcon, cat: 'Service' },
    { id: 'Counter staff', label: t('counterStaff') || 'Counter staff', icon: ShopIcon, cat: 'Service' },
    { id: 'Hostess', label: t('hostess') || 'Hostess', icon: FemaleIcon, cat: 'Service' },
    { id: 'Sommelier', label: t('sommelier') || 'Sommelier', icon: WineIcon, cat: 'Service' },
    { id: 'F&B service Associate', label: t('fbServiceAssociate') || 'F&B service Associate', icon: LineHelperIcon, cat: 'Service' },
    { id: 'F&B control Executive', label: t('fbControlExecutive') || 'F&B control Executive', icon: ProcurementExecutiveIcon, cat: 'Service' },
  ];



  const housekeepingRoles = [
    { id: 'Housekeeping Supervisor', label: t('housekeepingSupervisor') || 'Housekeeping Supervisor', icon: QASupervisorIcon, cat: 'Housekeeping' },
    { id: 'Housekeeping Attendant / Staff', label: t('housekeepingAttendant') || 'Housekeeping Attendant / Staff', icon: LineHelperIcon, cat: 'Housekeeping' },
    { id: 'Floor Attendant', label: t('floorAttendant') || 'Floor Attendant', icon: BroomIcon, cat: 'Housekeeping' },
    { id: 'Sanitation Staff / Hygiene Staff', label: t('sanitationHygieneStaff') || 'Sanitation Staff / Hygiene Staff', icon: SprayCan, cat: 'Housekeeping' },
    { id: 'Dish Washer', label: t('dishWasher') || 'Dish Washer', icon: DishWasherIcon, cat: 'Housekeeping' },
  ];

  const purchaseRoles = [
    { id: 'Purchase Manager/ Officer', label: t('purchaseManagerOfficer') || 'Purchase Manager/ Officer', icon: QAManagerIcon, cat: 'Store' },
    { id: 'Purchase Incharge', label: t('purchaseIncharge') || 'Purchase Incharge', icon: QASupervisorIcon, cat: 'Store' },
    { id: 'Store Incharge', label: t('storeInchargeRole') || 'Store Incharge', icon: ShopIcon, cat: 'Store' },
    { id: 'Stock keeper/Associate', label: t('stockKeeperAssociate') || 'Stock keeper/Associate', icon: LineHelperIcon, cat: 'Store' },
    { id: 'Inventory Controller', label: t('inventoryController') || 'Inventory Controller', icon: ProcurementExecutiveIcon, cat: 'Store' },
    { id: 'Vendor Relationship Executive', label: t('vendorRelationship') || 'Vendor Relationship Executive', icon: ProcurementExecutiveIcon, cat: 'Store' },
  ];
  const pastryRoles = [
    { id: 'Pastry cook', label: t('pastryCook') || 'Pastry cook', icon: PastryIcon, cat: 'Bakery' },
    { id: 'Baker / Head Baker', label: t('headBaker') || 'Baker / Head Baker', icon: PastryIcon, cat: 'Bakery' },
    { id: 'Executive pastry chef', label: t('executivePastryChef') || 'Executive pastry chef', icon: QAManagerIcon, cat: 'Bakery' },
    { id: 'Pastry Chef', label: t('pastryChef') || 'Pastry Chef', icon: QAManagerIcon, cat: 'Bakery' },
    { id: 'Cake Decorator', label: t('cakeDecorator') || 'Cake Decorator', icon: PastryIcon, cat: 'Bakery' },
    { id: 'Barista', label: t('barista') || 'Barista', icon: CoffeeIcon, cat: 'Bakery' },
    { id: 'Trainee', label: t('trainee') || 'Trainee', icon: TraineeIcon, cat: 'Bakery' },
    { id: 'Sweets Maker', label: t('sweetsMaker') || 'Sweets Maker', icon: PastryIcon, cat: 'Bakery' },
  ];

  const CalendarIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="calendar-check" size={size} color={color} />;
  const CashRegisterIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cash-register" size={size} color={color} />;
  const PhoneIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="phone-classic" size={size} color={color} />;

  const frontOfficeRoles = [
    { id: 'Front Office Executive', label: t('frontOfficeExecutive') || 'Front Office Executive', icon: ManagementIcon, cat: 'Front Office' },
    { id: 'Front office Manager', label: t('frontOfficeManager') || 'Front office Manager', icon: ManagementIcon, cat: 'Front Office' },
    { id: 'Receptionist', label: t('receptionist') || 'Receptionist', icon: FrontOfficeIcon, cat: 'Front Office' },
    { id: 'Reservationist', label: t('reservationist') || 'Reservationist', icon: CalendarIcon, cat: 'Front Office' },
    { id: 'Host/ Hostess', label: t('hostHostess') || 'Host/ Hostess', icon: FemaleIcon, cat: 'Front Office' },
    { id: 'Lobby Executive / Guest Service Associate', label: t('lobbyExecutive') || 'Lobby Executive / Guest Service Associate', icon: ManagementIcon, cat: 'Front Office' },
    { id: 'Doorman /Greeter', label: t('doormanGreeter') || 'Doorman /Greeter', icon: DoorIcon, cat: 'Front Office' },
    { id: 'Cashier', label: t('cashier') || 'Cashier', icon: CashRegisterIcon, cat: 'Front Office' },
    { id: 'Telephone operator', label: t('telephoneOperator') || 'Telephone operator', icon: PhoneIcon, cat: 'Front Office' },
  ];

  const businessTypesArray = businessType ? businessType.split(',') : [];
  const isHotelAndAccomodation = businessTypesArray.some(t => t.trim() === 'Hotel & Accomodation');
  const isFoodProcessingIndustry = businessTypesArray.some(t => t.trim() === 'Food Processing Industry');
  const isLaboratoryRD = businessTypesArray.some(t => t.trim() === 'Laboratory/R&D');
  const isRestaurantBakeryBar = businessTypesArray.some(t => t.trim() === 'Restaurant/Bakery/Bar');
  const isRetailDistribution = businessTypesArray.some(t => t.trim() === 'Retail/Distribution');

  const GenericRoleIcon = ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="briefcase-account-outline" size={size} color={color} />;

  const defaultCategoryList = [
    { id: 'Management', label: t('management') },
    { id: 'Kitchen', label: t('kitchenCulinary') || 'Kitchen / Culinary' },
    { id: 'Service', label: t('fbService') || 'F&B Service' },
    { id: 'Front Office', label: t('frontOffice') },
    { id: 'Housekeeping', label: t('housekeeping') },
    { id: 'Engineering', label: t('engineeringMaintenance') },
    { id: 'Bar', label: t('barBrewery') },
    { id: 'Bakery', label: t('pastry') },
    { id: 'Store', label: t('purchaseStore') },
    { id: 'Production', label: t('productionProcessing') || 'Production / Processing' },
    { id: 'Quality', label: t('qualityLab') || 'Quality / Lab' },
    { id: 'Distribution', label: t('logisticsDistribution') || 'Logistics / Distribution' },
    { id: 'Agriculture', label: t('agricultureFarming') || 'Agriculture / Farming' },
    { id: 'Admin / Accountant', label: t('adminAccountant') || 'Admin / Accountant' },
    { id: 'Purchase / Store', label: t('purchaseStore') || 'Purchase / Store' },
    { id: 'Kitchen/Operation', label: t('kitchenOperation') || 'Kitchen/Operation' },
    { id: 'Cleaning / Maintenance', label: t('cleaningMaintenance') || 'Cleaning / Maintenance' },
    { id: 'Procurement/Purchase', label: t('procurementPurchase') || 'Procurement/Purchase' },
    { id: 'Warehouse/Inventory', label: t('warehouseInventory') || 'Warehouse/Inventory' },
    { id: 'Logistics and supply chain', label: t('logisticsSupplyChain') || 'Logistics and supply chain' },
    { id: 'Customer service and Sales', label: t('customerServiceSales') || 'Customer service and Sales' },
    { id: 'E-Commerce & Digital', label: t('ecommerceDigital') || 'E-Commerce & Digital' },
    { id: 'Compliance', label: t('compliance') || 'Compliance' },
    { id: 'Accounts', label: t('accounts') || 'Accounts' },
  ];

  const foodProcessingCategoryList = [
    { id: 'Management', label: t('management') || 'Management' },
    { id: 'Production / Manufacturing', label: t('productionManufacturing') || 'Production / Manufacturing' },
    { id: 'Packing', label: t('packing') || 'Packing' },
    { id: 'Quality Control', label: t('qualityControl') || 'Quality Control' },
    { id: 'Quality', label: t('quality') || 'Quality' },
    { id: 'Maintenance & Engineering', label: t('maintenanceEngineering') || 'Maintenance & Engineering' },
    { id: 'Sanitisation', label: t('sanitisation') || 'Sanitisation' },
    { id: 'Research and Development', label: t('researchDevelopment') || 'Research and Development' },
    { id: 'Food Safety & Food Science', label: t('foodSafetyFoodScience') || 'Food Safety & Food Science' },
    { id: 'Executive / Hotel Leadership', label: t('executiveLeadership') || 'Executive / Hotel Leadership' },
    { id: 'Front Office Management', label: t('frontOfficeManagement') || 'Front Office Management' },
    { id: 'Food & Beverage Management', label: t('fbManagement') || 'Food & Beverage Management' },
    { id: 'Bell Service / Room Attendant', label: t('bellServiceRoomAttendant') || 'Bell Service / Room Attendant' },
    { id: 'Housekeeping Management/Laundry', label: t('housekeepingManagementLaundry') || 'Housekeeping Management/Laundry' },
    { id: 'Kitchen / Bar Staff', label: t('kitchenBarStaff') || 'Kitchen / Bar Staff' },
    { id: 'Service Staff', label: t('serviceStaff') || 'Service Staff' },
    { id: 'Sales & Marketing / Digital Sales', label: t('salesMarketingDigitalSales') || 'Sales & Marketing / Digital Sales' },
    { id: 'Security & Maintenance', label: t('securityMaintenance') || 'Security & Maintenance' },
    { id: 'Admin / HR / Finance / Purchase', label: t('adminHrFinancePurchase') || 'Admin / HR / Finance / Purchase' },
    { id: 'IT', label: t('it') || 'IT' },
    { id: 'Product Development', label: t('productDevelopment') || 'Product Development' },
    { id: 'Research & Laboratory', label: t('researchLaboratory') || 'Research & Laboratory' },
    { id: 'Food Safety & Quality Assurance', label: t('foodSafetyQualityAssurance') || 'Food Safety & Quality Assurance' },
    { id: 'Education & Consultant', label: t('educationConsultant') || 'Education & Consultant' },
    { id: 'Compliances', label: t('compliances') || 'Compliances' },
    { id: 'IT & Photography', label: t('itPhotography') || 'IT & Photography' },
    { id: 'Admin / Accountant', label: t('adminAccountant') || 'Admin / Accountant' },
    { id: 'Purchase / Store', label: t('purchaseStore') || 'Purchase / Store' },
    { id: 'Kitchen / Operation', label: t('kitchenOperation') || 'Kitchen / Operation' },
    { id: 'Cleaning / Maintenance', label: t('cleaningMaintenance') || 'Cleaning / Maintenance' },
    { id: 'Procurement / Purchase', label: t('procurementPurchase') || 'Procurement / Purchase' },
    { id: 'Warehouse / Inventory', label: t('warehouseInventory') || 'Warehouse / Inventory' },
    { id: 'Logistics and supply chain', label: t('logisticsSupplyChain') || 'Logistics and supply chain' },
    { id: 'Customer service and Sales', label: t('customerServiceSales') || 'Customer service and Sales' },
    { id: 'Ecommerce & Digital', label: t('ecommerceDigital') || 'Ecommerce & Digital' },
    { id: 'Accounts', label: t('accounts') || 'Accounts' },
  ];

  const hotelCategoryList = [
    { id: 'Executive / Hotel Leadership', label: t('executiveLeadership') || 'Executive / Hotel Leadership' },
    { id: 'Front Office Management', label: t('frontOfficeManagement') || 'Front Office Management' },
    { id: 'Food & Beverage Management', label: t('fbManagement') || 'Food & Beverage Management' },
    { id: 'Bell service/ Room Attendant', label: t('bellServiceRoomAttendant') || 'Bell service/ Room Attendant' },
    { id: 'Housekeeping Management/ Laundry', label: t('housekeepingManagementLaundry') || 'Housekeeping Management/ Laundry' },
    { id: 'Kitchen/Bar Staff', label: t('kitchenBarStaff') || 'Kitchen/Bar Staff' },
    { id: 'Service Staff', label: t('serviceStaff') || 'Service Staff' },
    { id: 'Sales & Marketing / Digital Sales', label: t('salesMarketingDigitalSales') || 'Sales & Marketing / Digital Sales' },
    { id: 'Security & Maintanance', label: t('securityMaintenance') || 'Security & Maintanance' },
    { id: 'Admin/ HR/ Finance/Purchase', label: t('adminHrFinancePurchase') || 'Admin/ HR/ Finance/Purchase' },
    { id: 'IT', label: t('it') || 'IT' },
  ];

  const labRdCategoryList = [
    { id: 'Management', label: t('management') || 'Management' },
    { id: 'Product Development', label: t('productDevelopment') || 'Product Development' },
    { id: 'Research & Laboratory', label: t('researchLaboratory') || 'Research & Laboratory' },
    { id: 'Food Safety & Quality Assurance', label: t('foodSafetyQualityAssurance') || 'Food Safety & Quality Assurance' },
    { id: 'Education & Consultant', label: t('educationConsultant') || 'Education & Consultant' },
    { id: 'Compliances', label: t('compliances') || 'Compliances' },
    { id: 'Nutritionist', label: t('nutritionist') || 'Nutritionist' },
    { id: 'IT & Photography', label: t('itPhotography') || 'IT & Photography' },
  ];

  const labRdRoles = [
    { id: 'RD Director LabRD', label: t('rdDirector') || 'Research & Development Director', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Innovation Manager LabRD', label: t('innovationManager') || 'Innovation Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Research Manager LabRD', label: t('researchManager') || 'Research Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Product Developer LabRD', label: t('productDeveloper') || 'Product Developer', icon: LabIcon, cat: 'Product Development' },
    { id: 'RD Chef LabRD', label: t('rdChef') || 'Research & Development Chef', icon: ChefHatIcon, cat: 'Product Development' },
    { id: 'Culinary Developer LabRD', label: t('culinaryDeveloper') || 'Culinary Developer', icon: ChefHatIcon, cat: 'Product Development' },
    { id: 'Application Specialist LabRD', label: t('applicationSpecialist') || 'Application Specialist', icon: QASupervisorIcon, cat: 'Product Development' },
    { id: 'Food Scientist LabRD', label: t('foodScientist') || 'Food Scientist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Flavor Chemist LabRD', label: t('flavorChemist') || 'Flavor Chemist', icon: AdditiveIcon, cat: 'Research & Laboratory' },
    { id: 'Texture Specialist LabRD', label: t('textureSpecialist') || 'Texture Specialist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Ingredient Specialist LabRD', label: t('ingredientSpecialist') || 'Ingredient Specialist', icon: AdditiveIcon, cat: 'Research & Laboratory' },
    { id: 'Recipe Formulator LabRD', label: t('recipeFormulator') || 'Recipe Formulator', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Nutritionist LabRD', label: t('nutritionist') || 'Nutritionist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Product Formulator LabRD', label: t('productFormulator') || 'Product Formulator', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Sensory Analyst LabRD', label: t('sensoryAnalyst') || 'Sensory Analyst', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Taste Tester LabRD', label: t('tasteTester') || 'Taste Tester', icon: FoodIcon, cat: 'Research & Laboratory' },
    { id: 'Consumer Researcher LabRD', label: t('consumerResearcher') || 'Consumer Researcher', icon: QASupervisorIcon, cat: 'Research & Laboratory' },
    { id: 'Panel Leader LabRD', label: t('panelLeader') || 'Panel Leader', icon: QASupervisorIcon, cat: 'Research & Laboratory' },
    { id: 'Lab Technician LabRD', label: t('labTechnician') || 'Lab Technician', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Research Associate LabRD', label: t('researchAssociate') || 'Research Associate', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Food Microbiologist LabRD', label: t('foodMicrobiologist') || 'Food Microbiologist', icon: LabIcon, cat: 'Research & Laboratory' },
    { id: 'Analytical Chemist LabRD', label: t('analyticalChemist') || 'Analytical Chemist', icon: AdditiveIcon, cat: 'Research & Laboratory' },
    { id: 'Food Safety Specialist LabRD', label: t('foodSafetySpecialist') || 'Food Safety Specialist', icon: SafetyOfficerIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'HACCP Coordinator LabRD', label: t('haccpCoordinator') || 'HACCP Coordinator', icon: RegIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'Sanitarian LabRD', label: t('sanitarian') || 'Sanitarian', icon: BroomIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'QA Manager LabRD', label: t('qaManager') || 'QA Manager', icon: QAManagerIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'Quality Systems Coordinator LabRD', label: t('qualitySystemsCoordinator') || 'Quality Systems Coordinator', icon: QASupervisorIcon, cat: 'Food Safety & Quality Assurance' },
    { id: 'Culinary Instructor LabRD', label: t('culinaryInstructor') || 'Culinary Instructor', icon: ChefHatIcon, cat: 'Education & Consultant' },
    { id: 'Cooking Teacher LabRD', label: t('cookingTeacher') || 'Cooking Teacher', icon: ChefHatIcon, cat: 'Education & Consultant' },
    { id: 'Food Safety Trainer LabRD', label: t('foodSafetyTrainer') || 'Food Safety Trainer', icon: SafetyOfficerIcon, cat: 'Education & Consultant' },
    { id: 'Corporate Trainer LabRD', label: t('corporateTrainer') || 'Corporate Trainer', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Food Business Consultant LabRD', label: t('foodBusinessConsultant') || 'Food Business Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Restaurant Consultant LabRD', label: t('restaurantConsultant') || 'Restaurant Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Menu Engineer LabRD', label: t('menuEngineer') || 'Menu Engineer', icon: FoodIcon, cat: 'Education & Consultant' },
    { id: 'Sustainability Consultant LabRD', label: t('sustainabilityConsultant') || 'Sustainability Consultant', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Food Attorney LabRD', label: t('foodAttorney') || 'Food Attorney', icon: QAManagerIcon, cat: 'Education & Consultant' },
    { id: 'Regulatory Consultant LabRD', label: t('regulatoryConsultant') || 'Regulatory Consultant', icon: RegIcon, cat: 'Education & Consultant' },
    { id: 'Regulatory Affairs Specialist LabRD', label: t('regulatoryAffairsSpecialist') || 'Regulatory Affairs Specialist', icon: RegIcon, cat: 'Compliances' },
    { id: 'Compliance Officer LabRD', label: t('complianceOfficer') || 'Compliance Officer', icon: SafetyOfficerIcon, cat: 'Compliances' },
    { id: 'Labeling Specialist LabRD', label: t('labelingSpecialist') || 'Labeling Specialist', icon: QASupervisorIcon, cat: 'Compliances' },
    { id: 'Registered Dietitian LabRD', label: t('registeredDietitian') || 'Registered Dietitian', icon: NutraIcon, cat: 'Nutritionist' },
    { id: 'Clinical Nutritionist LabRD', label: t('clinicalNutritionist') || 'Clinical Nutritionist', icon: NutraIcon, cat: 'Nutritionist' },
    { id: 'Public Health Nutritionist LabRD', label: t('publicHealthNutritionist') || 'Public Health Nutritionist', icon: NutraIcon, cat: 'Nutritionist' },
    { id: 'WIC Coordinator LabRD', label: t('wicCoordinator') || 'WIC Coordinator', icon: QASupervisorIcon, cat: 'Nutritionist' },
    { id: 'Corporate Nutritionist LabRD', label: t('corporateNutritionist') || 'Corporate Nutritionist', icon: NutraIcon, cat: 'Nutritionist' },
    { id: 'Wellness Coordinator LabRD', label: t('wellnessCoordinator') || 'Wellness Coordinator', icon: QASupervisorIcon, cat: 'Nutritionist' },
    { id: 'Sports Nutritionist LabRD', label: t('sportsNutritionist') || 'Sports Nutritionist', icon: NutraIcon, cat: 'Nutritionist' },
    { id: 'Performance Dietitian LabRD', label: t('performanceDietitian') || 'Performance Dietitian', icon: NutraIcon, cat: 'Nutritionist' },
    { id: 'Food Equipment Engineer LabRD', label: t('foodEquipmentEngineer') || 'Food Equipment Engineer', icon: EngineeringIcon, cat: 'Nutritionist' },
    { id: 'Food Writer LabRD', label: t('foodWriter') || 'Food Writer', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Blogger LabRD', label: t('foodBlogger') || 'Food Blogger', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Content Creator LabRD', label: t('contentCreator') || 'Content Creator', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Photographer LabRD', label: t('foodPhotographer') || 'Food Photographer', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Stylist LabRD', label: t('foodStylist') || 'Food Stylist', icon: LineHelperIcon, cat: 'IT & Photography' },
    { id: 'Food Brand Manager LabRD', label: t('foodBrandManager') || 'Food Brand Manager', icon: QAManagerIcon, cat: 'IT & Photography' },
    { id: 'Social Media Specialist LabRD', label: t('socialMediaSpecialist') || 'Social Media Specialist', icon: QASupervisorIcon, cat: 'IT & Photography' },
  ];

  const restaurantCategoryList = [
    { id: 'Management', label: t('management') || 'Management' },
    { id: 'Admin / Accountant', label: t('adminAccountant') || 'Admin / Accountant' },
    { id: 'Purchase / Store', label: t('purchaseStore') || 'Purchase / Store' },
    { id: 'Kitchen/Operation', label: t('kitchenOperation') || 'Kitchen / Operation' },
    { id: 'Cleaning / Maintenance', label: t('cleaningMaintenance') || 'Cleaning / Maintenance' },
  ];

  const retailCategoryList = [
    { id: 'Management', label: t('management') || 'Management' },
    { id: 'Procurement/Purchase', label: t('procurementPurchase') || 'Procurement/Purchase' },
    { id: 'Warehouse/Inventory', label: t('warehouseInventory') || 'Warehouse/Inventory' },
    { id: 'Logistics and supply chain', label: t('logisticsSupplyChain') || 'Logistics and supply chain' },
    { id: 'Customer service and Sales', label: t('customerServiceSales') || 'Customer service and Sales' },
    { id: 'E-Commerce & Digital', label: t('ecommerceDigital') || 'E-commerce & Digital' },
    { id: 'Compliance', label: t('compliance') || 'Compliance' },
    { id: 'Quality', label: t('quality') || 'Quality' },
    { id: 'Accounts', label: t('accounts') || 'Accounts' },
  ];



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

  const hotelAndAccomodationRoles = [
    { id: 'Chief Executive Officer (CEO)', label: t('ceo') || 'Chief Executive Officer (CEO)', icon: GenericRoleIcon, dept: 'Executive Leadership', cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Operating Officer (COO)', label: t('coo') || 'Chief Operating Officer (COO)', icon: GenericRoleIcon, dept: 'Executive Leadership', cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Financial Officer (CFO)', label: t('cfo') || 'Chief Financial Officer (CFO)', icon: GenericRoleIcon, dept: 'Executive Leadership', cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Marketing Officer (CMO)', label: t('cmo') || 'Chief Marketing Officer (CMO)', icon: GenericRoleIcon, dept: 'Executive Leadership', cat: 'Executive / Hotel Leadership' },
    { id: 'Chief Revenue Officer', label: t('cro') || 'Chief Revenue Officer', icon: GenericRoleIcon, dept: 'Executive Leadership', cat: 'Executive / Hotel Leadership' },
    { id: 'Regional Director', label: t('regionalDirector') || 'Regional Director', icon: GenericRoleIcon, dept: 'Executive Leadership', cat: 'Executive / Hotel Leadership' },
    { id: 'Area General Manager', label: t('areaGeneralManager') || 'Area General Manager', icon: GenericRoleIcon, dept: 'Executive Leadership', cat: 'Executive / Hotel Leadership' },
    { id: 'Front Office Manager', label: t('frontOfficeManager') || 'Front Office Manager', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Assistant Front Office Manager', label: t('asstFrontOfficeManager') || 'Assistant Front Office Manager', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Guest Relations Manager', label: t('guestRelationsManager') || 'Guest Relations Manager', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Night Manager', label: t('nightManager') || 'Night Manager', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Front Desk Supervisor', label: t('frontDeskSupervisor') || 'Front Desk Supervisor', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Front Desk Agent', label: t('frontDeskAgent') || 'Front Desk Agent', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Guest Service Agent', label: t('guestServiceAgent') || 'Guest Service Agent', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Receptionist', label: t('receptionist') || 'Receptionist', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Night Auditor', label: t('nightAuditor') || 'Night Auditor', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Front Office Management' },
    { id: 'Concierge', label: t('concierge') || 'Concierge', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Concierge' },
    { id: 'Chef Concierge', label: t('chefConcierge') || 'Chef Concierge', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Concierge' },
    { id: "Les Clefs d'Or Concierge", label: t('lesClefsOrConcierge') || "Les Clefs d'Or Concierge", icon: GenericRoleIcon, dept: 'Front Office', cat: 'Concierge' },
    { id: 'Bell Captain', label: t('bellCaptain') || 'Bell Captain', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Bell service/ Room Attendant' },
    { id: 'Bell Attendant', label: t('bellAttendant') || 'Bell Attendant', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Bell service/ Room Attendant' },
    { id: 'Bellman', label: t('bellman') || 'Bellman', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Bellman' },
    { id: 'Doorman', label: t('doorman') || 'Doorman', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Bell service/ Room Attendant' },
    { id: 'Luggage Porter', label: t('luggagePorter') || 'Luggage Porter', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Bell service/ Room Attendant' },
    { id: 'Valet Parking Attendant', label: t('valetParkingAttendant') || 'Valet Parking Attendant', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Bell service/ Room Attendant' },
    { id: 'Switchboard Operator', label: t('telephoneOperator') || 'Telephone Operator', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Communications' },
    { id: 'Hotel Operator', label: t('telephoneOperator') || 'Hotel Operator', icon: GenericRoleIcon, dept: 'Front Office', cat: 'Communications' },
    { id: 'Executive Housekeeper', label: t('executiveHousekeeper') || 'Executive Housekeeper', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Assistant Executive Housekeeper', label: t('asstExecutiveHousekeeper') || 'Assistant Executive Housekeeper', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Housekeeping Manager', label: t('housekeepingManager') || 'Housekeeping Manager', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Laundry Manager', label: t('laundryManager') || 'Laundry Manager', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Housekeeping Supervisor', label: t('housekeepingSupervisor') || 'Housekeeping Supervisor', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Floor Supervisor', label: t('floorSupervisor') || 'Floor Supervisor', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Public Area Supervisor', label: t('publicAreaSupervisor') || 'Public Area Supervisor', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Linen Room Supervisor', label: t('linenRoomSupervisor') || 'Linen Room Supervisor', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Room Attendant', label: t('roomAttendant') || 'Room Attendant', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Houseman', label: t('houseman') || 'Houseman', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Turndown Attendant', label: t('turndownAttendant') || 'Turndown Attendant', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Laundry Attendant', label: t('laundryAttendant') || 'Laundry Attendant', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Laundry Worker', label: t('laundryWorker') || 'Laundry Worker', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Valet Runner', label: t('valetRunner') || 'Valet Runner', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Dry Cleaner', label: t('dryCleaner') || 'Dry Cleaner', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Seamstress/Tailor', label: t('seamstressTailor') || 'Seamstress/Tailor', icon: GenericRoleIcon, dept: 'Housekeeping', cat: 'Housekeeping Management/ Laundry' },
    { id: 'Banquet catering', label: t('banquetCatering') || 'Banquet catering', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Director of Food & Beverage', label: t('directorFB') || 'Director of Food & Beverage', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Assistant Director of Food & Beverage', label: t('asstDirectorFB') || 'Assistant Director of Food & Beverage', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'F&B Manager', label: t('fbManager') || 'F&B Manager', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Outlet Manager', label: t('outletManager') || 'Outlet Manager', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Banquet Manager', label: t('banquetManager') || 'Banquet Manager', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Room Service Manager', label: t('roomServiceManager') || 'Room Service Manager', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Catering Manager', label: t('cateringManager') || 'Catering Manager', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Bar Manager', label: t('barManager') || 'Bar Manager', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Beverage Director', label: t('beverageDirector') || 'Beverage Director', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Restaurant Manager', label: t('restaurantManager') || 'Restaurant Manager', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'F&B Supervisor', label: t('fbSupervisor') || 'F&B Supervisor', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Head Server', label: t('headServer') || 'Head Server', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Head Bartender', label: t('headBartender') || 'Head Bartender', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Banquet Captain', label: t('banquetCaptain') || 'Banquet Captain', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Room Service Supervisor', label: t('roomServiceSupervisor') || 'Room Service Supervisor', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Catering Coordinator', label: t('cateringCoordinator') || 'Catering Coordinator', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Catering Sales Manager', label: t('cateringSalesManager') || 'Catering Sales Manager', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },
    { id: 'Event Planner', label: t('eventPlanner') || 'Event Planner', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Food & Beverage Management' },

    // Service Staff roles
    { id: 'Server/Waiter', label: t('serverWaiter') || 'Server/Waiter', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Banquet Server', label: t('banquetServer') || 'Banquet Server', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Cocktail Server', label: t('cocktailServer') || 'Cocktail Server', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Busser', label: t('busser') || 'Busser', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Food Runner', label: t('foodRunner') || 'Food Runner', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Room Service Attendant', label: t('roomServiceAttendant') || 'Room Service Attendant', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'In-Room Dining Server', label: t('inRoomDiningServer') || 'In-Room Dining Server', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Bartender', label: t('bartender') || 'Bartender', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Barback', label: t('barback') || 'Barback', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Sommelier', label: t('sommelier') || 'Sommelier', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Barista', label: t('barista') || 'Barista', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Cocktail Mixologist', label: t('cocktailMixologist') || 'Cocktail Mixologist', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Host/Hostess', label: t('hostHostess') || 'Host/Hostess', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Greeter', label: t('greeter') || 'Greeter', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Banquet Setup Attendant', label: t('banquetSetupAttendant') || 'Banquet Setup Attendant', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Banquet Houseman', label: t('banquetHouseman') || 'Banquet Houseman', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Banquet Porter', label: t('banquetPorter') || 'Banquet Porter', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Service Staff' },
    { id: 'Executive Chef', label: t('executiveChef') || 'Executive Chef', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Sous Chef', label: t('sousChef') || 'Sous Chef', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Chef de Partie', label: t('chefDePartie') || 'Chef de Partie', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Line Cook', label: t('lineCook') || 'Line Cook', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Prep Cook', label: t('prepCook') || 'Prep Cook', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Pastry Chef', label: t('pastryChef') || 'Pastry Chef', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Banquet Chef', label: t('banquetChef') || 'Banquet Chef', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Kitchen Steward', label: t('kitchenSteward') || 'Kitchen Steward', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Dishwasher', label: t('dishwasher') || 'Dishwasher', icon: GenericRoleIcon, dept: 'Food & Beverage', cat: 'Kitchen/Bar Staff' },
    { id: 'Director of Sales & Marketing', label: t('directorSalesMarketing') || 'Director of Sales & Marketing', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Sales', label: t('directorSales') || 'Director of Sales', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Marketing', label: t('directorMarketing') || 'Director of Marketing', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Director of Revenue Management', label: t('directorRevenue') || 'Director of Revenue Management', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Manager', label: t('salesManager') || 'Sales Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Marketing Manager', label: t('marketingManager') || 'Marketing Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Digital Marketing Manager', label: t('digitalMarketingManager') || 'Digital Marketing Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Social Media Manager', label: t('socialMediaManager') || 'Social Media Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Communications Manager', label: t('communicationsManager') || 'Communications Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Brand Manager', label: t('brandManager') || 'Brand Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Executive', label: t('salesExecutive') || 'Sales Executive', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Corporate Sales Manager', label: t('corporateSalesManager') || 'Corporate Sales Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Leisure Sales Manager', label: t('leisureSalesManager') || 'Leisure Sales Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Group Sales Manager', label: t('groupSalesManager') || 'Group Sales Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Wedding Sales Manager', label: t('weddingSalesManager') || 'Wedding Sales Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Conference Sales Manager', label: t('conferenceSalesManager') || 'Conference Sales Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Sales Coordinator', label: t('salesCoordinator') || 'Sales Coordinator', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Catering Sales Manager', label: t('cateringSalesManager') || 'Catering Sales Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Marketing Coordinator', label: t('marketingCoordinator') || 'Marketing Coordinator', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Content Creator', label: t('contentCreator') || 'Content Creator', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Graphic Designer', label: t('graphicDesigner') || 'Graphic Designer', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Public Relations Manager', label: t('prManager') || 'Public Relations Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'SEO Specialist', label: t('seoSpecialist') || 'SEO Specialist', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'E-commerce Manager', label: t('ecommerceManager') || 'E-commerce Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Website Manager', label: t('websiteManager') || 'Website Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Online Reputation Manager', label: t('onlineReputationManager') || 'Online Reputation Manager', icon: GenericRoleIcon, dept: 'Sales & Marketing', cat: 'Sales & Marketing / Digital Sales' },
    { id: 'Maintenance Manager', label: t('maintenanceManager') || 'Maintenance Manager', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Engineering Supervisor', label: t('engineeringSupervisor') || 'Engineering Supervisor', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Maintenance Technician', label: t('maintenanceTechnician') || 'Maintenance Technician', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'General Maintenance', label: t('generalMaintenance') || 'General Maintenance', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'HVAC Technician', label: t('hvacTechnician') || 'HVAC Technician', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Electrician', label: t('electrician') || 'Electrician', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Plumber', label: t('plumber') || 'Plumber', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Carpenter', label: t('carpenter') || 'Carpenter', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Painter', label: t('painter') || 'Painter', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Pool Maintenance Technician', label: t('poolMaintenanceTechnician') || 'Pool Maintenance Technician', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Refrigeration Technician', label: t('refrigerationTechnician') || 'Refrigeration Technician', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Handyman', label: t('handyman') || 'Handyman', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Landscaper', label: t('landscaper') || 'Landscaper', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Groundskeeper', label: t('groundskeeper') || 'Groundskeeper', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Gardener', label: t('gardener') || 'Gardener', icon: GenericRoleIcon, dept: 'Engineering & Maintenance', cat: 'Security & Maintanance' },
    { id: 'Director of Security', label: t('directorSecurity') || 'Director of Security', icon: GenericRoleIcon, dept: 'Security', cat: 'Security & Maintanance' },
    { id: 'Security Manager', label: t('securityManager') || 'Security Manager', icon: GenericRoleIcon, dept: 'Security', cat: 'Security & Maintanance' },
    { id: 'Security Supervisor', label: t('securitySupervisor') || 'Security Supervisor', icon: GenericRoleIcon, dept: 'Security', cat: 'Security & Maintanance' },
    { id: 'Security Officer', label: t('securityOfficer') || 'Security Officer', icon: GenericRoleIcon, dept: 'Security', cat: 'Security & Maintanance' },
    { id: 'Patrol Officer', label: t('patrolOfficer') || 'Patrol Officer', icon: GenericRoleIcon, dept: 'Security', cat: 'Security & Maintanance' },
    { id: 'Loss Prevention Officer', label: t('lossPreventionOfficer') || 'Loss Prevention Officer', icon: GenericRoleIcon, dept: 'Security', cat: 'Security & Maintanance' },
    { id: 'CCTV Operator', label: t('cctvOperator') || 'CCTV Operator', icon: GenericRoleIcon, dept: 'Security', cat: 'Security & Maintanance' },
    { id: 'Night Security Guard', label: t('nightSecurityGuard') || 'Night Security Guard', icon: GenericRoleIcon, dept: 'Security', cat: 'Security & Maintanance' },
    { id: 'Director of Human Resources', label: t('directorHR') || 'Director of Human Resources', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'HR Manager', label: t('hrManager') || 'HR Manager', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Talent Acquisition Manager', label: t('talentAcquisitionManager') || 'Talent Acquisition Manager', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Training Manager', label: t('trainingManager') || 'Training Manager', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Recruiter', label: t('recruiter') || 'Recruiter', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Talent Acquisition Specialist', label: t('talentAcquisitionSpecialist') || 'Talent Acquisition Specialist', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'HR Generalist', label: t('hrGeneralist') || 'HR Generalist', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'HR Coordinator', label: t('hrCoordinator') || 'HR Coordinator', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'HR Assistant', label: t('hrAssistant') || 'HR Assistant', icon: GenericRoleIcon, dept: 'Human Resources', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Director of Finance', label: t('directorFinance') || 'Director of Finance', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Finance Manager', label: t('financeManager') || 'Finance Manager', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Accounting Manager', label: t('accountingManager') || 'Accounting Manager', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Assistant Controller', label: t('assistantController') || 'Assistant Controller', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Staff Accountant', label: t('staffAccountant') || 'Staff Accountant', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Accounts Payable Clerk', label: t('accountsPayableClerk') || 'Accounts Payable Clerk', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Accounts Receivable Clerk', label: t('accountsReceivableClerk') || 'Accounts Receivable Clerk', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'General Cashier', label: t('generalCashier') || 'General Cashier', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Income Auditor', label: t('incomeAuditor') || 'Income Auditor', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Night Auditor', label: t('nightAuditor') || 'Night Auditor', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Payroll Clerk', label: t('payrollClerk') || 'Payroll Clerk', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Cost Controller', label: t('costController') || 'Cost Controller', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Food & Beverage Controller', label: t('fbController') || 'Food & Beverage Controller', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Purchasing Manager', label: t('purchasingManager') || 'Purchasing Manager', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Purchasing Clerk', label: t('purchasingClerk') || 'Purchasing Clerk', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Receiving Clerk', label: t('receivingClerk') || 'Receiving Clerk', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Inventory Controller', label: t('inventoryController') || 'Inventory Controller', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Credit Manager', label: t('creditManager') || 'Credit Manager', icon: GenericRoleIcon, dept: 'Finance & Accounting', cat: 'Admin/ HR/ Finance/Purchase' },
    { id: 'Spa Director', label: t('spaDirector') || 'Spa Director', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Management' },
    { id: 'Spa Manager', label: t('spaManager') || 'Spa Manager', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Management' },
    { id: 'Fitness Center Manager', label: t('fitnessCenterManager') || 'Fitness Center Manager', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Management' },
    { id: 'Spa Supervisor', label: t('spaSupervisor') || 'Spa Supervisor', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Management' },
    { id: 'Massage Therapist', label: t('massageTherapist') || 'Massage Therapist', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Therapists' },
    { id: 'Esthetician', label: t('esthetician') || 'Esthetician', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Therapists' },
    { id: 'Skincare Specialist', label: t('skincareSpecialist') || 'Skincare Specialist', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Therapists' },
    { id: 'Nail Technician', label: t('nailTechnician') || 'Nail Technician', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Therapists' },
    { id: 'Body Treatment Specialist', label: t('bodyTreatmentSpecialist') || 'Body Treatment Specialist', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Therapists' },
    { id: 'Personal Trainer', label: t('personalTrainer') || 'Personal Trainer', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Fitness' },
    { id: 'Fitness Instructor', label: t('fitnessInstructor') || 'Fitness Instructor', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Fitness' },
    { id: 'Yoga Instructor', label: t('yogaInstructor') || 'Yoga Instructor', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Fitness' },
    { id: 'Group Exercise Instructor', label: t('groupExerciseInstructor') || 'Group Exercise Instructor', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Fitness' },
    { id: 'Spa Attendant', label: t('spaAttendant') || 'Spa Attendant', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Service' },
    { id: 'Locker Room Attendant', label: t('lockerRoomAttendant') || 'Locker Room Attendant', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Service' },
    { id: 'Spa Receptionist', label: t('spaReceptionist') || 'Spa Receptionist', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Service' },
    { id: 'Spa Concierge', label: t('spaConcierge') || 'Spa Concierge', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Service' },
    { id: 'Wellness Coach', label: t('wellnessCoach') || 'Wellness Coach', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Service' },
    { id: 'Meditation Instructor', label: t('meditationInstructor') || 'Meditation Instructor', icon: GenericRoleIcon, dept: 'Spa & Wellness', cat: 'Wellness' },
    { id: 'Recreation Manager', label: t('recreationManager') || 'Recreation Manager', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Management' },
    { id: 'Activities Director', label: t('activitiesDirector') || 'Activities Director', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Management' },
    { id: 'Pool Attendant', label: t('poolAttendant') || 'Pool Attendant', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Pool' },
    { id: 'Lifeguard', label: t('lifeguard') || 'Lifeguard', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Pool' },
    { id: 'Aquatics Instructor', label: t('aquaticsInstructor') || 'Aquatics Instructor', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Pool' },
    { id: 'Activities Coordinator', label: t('activitiesCoordinator') || 'Activities Coordinator', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Activities' },
    { id: 'Recreation Attendant', label: t('recreationAttendant') || 'Recreation Attendant', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Activities' },
    { id: "Children's Program Coordinator", label: t('kidsProgramCoordinator') || "Children's Program Coordinator", icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Activities' },
    { id: 'Kids Club Attendant', label: t('kidsClubAttendant') || 'Kids Club Attendant', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Activities' },
    { id: 'Game Room Attendant', label: t('gameRoomAttendant') || 'Game Room Attendant', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Activities' },
    { id: 'Golf Professional', label: t('golfProfessional') || 'Golf Professional', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Sports' },
    { id: 'Golf Course Marshal', label: t('golfCourseMarshal') || 'Golf Course Marshal', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Sports' },
    { id: 'Tennis Professional', label: t('tennisProfessional') || 'Tennis Professional', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Sports' },
    { id: 'Beach Attendant', label: t('beachAttendant') || 'Beach Attendant', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Sports' },
    { id: 'Entertainment Coordinator', label: t('entertainmentCoordinator') || 'Entertainment Coordinator', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Entertainment' },
    { id: 'Evening Entertainment Staff', label: t('eveningEntertainmentStaff') || 'Evening Entertainment Staff', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Entertainment' },
    { id: 'Adventure Guide', label: t('adventureGuide') || 'Adventure Guide', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Outdoor' },
    { id: 'Tour Guide', label: t('tourGuide') || 'Tour Guide', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Outdoor' },
    { id: 'Outdoor Activities Leader', label: t('outdoorActivitiesLeader') || 'Outdoor Activities Leader', icon: GenericRoleIcon, dept: 'Recreation & Activities', cat: 'Outdoor' },
    { id: 'Inventory Analyst', label: t('inventoryAnalyst') || 'Inventory Analyst', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Analysts' },
    { id: 'Demand Analyst', label: t('demandAnalyst') || 'Demand Analyst', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Analysts' },
    { id: 'Pricing Analyst', label: t('pricingAnalyst') || 'Pricing Analyst', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Analysts' },
    { id: 'Revenue Management Systems Specialist', label: t('revenueSystemsSpecialist') || 'Revenue Management Systems Specialist', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Analysts' },
    { id: 'Distribution Manager', label: t('distributionManager') || 'Distribution Manager', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Distribution' },
    { id: 'Channel Manager', label: t('channelManager') || 'Channel Manager', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Distribution' },
    { id: 'Reservations Manager', label: t('reservationsManager') || 'Reservations Manager', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Reservations' },
    { id: 'Reservations Supervisor', label: t('reservationsSupervisor') || 'Reservations Supervisor', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Reservations' },
    { id: 'Reservations Agent', label: t('reservationsAgent') || 'Reservations Agent', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Reservations' },
    { id: 'Group Reservations Coordinator', label: t('groupReservationsCoordinator') || 'Group Reservations Coordinator', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Reservations' },
    { id: 'Business Intelligence Analyst', label: t('biAnalyst') || 'Business Intelligence Analyst', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Analytics' },
    { id: 'Data Analyst', label: t('dataAnalyst') || 'Data Analyst', icon: GenericRoleIcon, dept: 'Revenue Management', cat: 'Analytics' },
    { id: 'Director of IT', label: t('directorIT') || 'Director of IT', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'IT Manager', label: t('itManager') || 'IT Manager', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'Systems Manager', label: t('systemsManager') || 'Systems Manager', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'IT Support Specialist', label: t('itSupportSpecialist') || 'IT Support Specialist', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'Help Desk Technician', label: t('helpDeskTechnician') || 'Help Desk Technician', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'Network Administrator', label: t('networkAdmin') || 'Network Administrator', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'Systems Administrator', label: t('systemsAdmin') || 'Systems Administrator', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'Database Administrator', label: t('dbAdmin') || 'Database Administrator', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'Web Developer', label: t('webDeveloper') || 'Web Developer', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'Software Developer', label: t('softwareDeveloper') || 'Software Developer', icon: GenericRoleIcon, dept: 'IT & Technology', cat: 'IT' },
    { id: 'Director of Procurement', label: t('directorProcurement') || 'Director of Procurement', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Management' },
    { id: 'Buyer', label: t('buyer') || 'Buyer', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Buying' },
    { id: 'Purchasing Agent', label: t('purchasingAgent') || 'Purchasing Agent', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Buying' },
    { id: 'Sourcing Specialist', label: t('sourcingSpecialist') || 'Sourcing Specialist', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Buying' },
    { id: 'Receiver', label: t('receiver') || 'Receiver', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Receiving' },
    { id: 'Inventory Manager', label: t('inventoryManager') || 'Inventory Manager', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Supply Chain' },
    { id: 'Inventory Clerk', label: t('inventoryClerk') || 'Inventory Clerk', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Supply Chain' },
    { id: 'Storeroom Keeper', label: t('storeroomKeeper') || 'Storeroom Keeper', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Supply Chain' },
    { id: 'Logistics Coordinator', label: t('logisticsCoordinator') || 'Logistics Coordinator', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Supply Chain' },
    { id: 'Supplier Relations Manager', label: t('supplierRelationsManager') || 'Supplier Relations Manager', icon: GenericRoleIcon, dept: 'Procurement & Supply Chain', cat: 'Supply Chain' },
    { id: 'Director of Events', label: t('directorEvents') || 'Director of Events', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Management' },
    { id: 'Events Manager', label: t('eventsManager') || 'Events Manager', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Management' },
    { id: 'Conference Services Manager', label: t('conferenceServicesManager') || 'Conference Services Manager', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Management' },
    { id: 'Meeting Services Manager', label: t('meetingServicesManager') || 'Meeting Services Manager', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Management' },
    { id: 'Wedding Planner', label: t('weddingPlanner') || 'Wedding Planner', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Management' },
    { id: 'Meeting Coordinator', label: t('meetingCoordinator') || 'Meeting Coordinator', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Operations' },
    { id: 'Conference Coordinator', label: t('conferenceCoordinator') || 'Conference Coordinator', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Operations' },
    { id: 'Banquet Sales Manager', label: t('banquetSalesManager') || 'Banquet Sales Manager', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Operations' },
    { id: 'Event Setup Attendant', label: t('eventSetupAttendant') || 'Event Setup Attendant', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Operations' },
    { id: 'Conference Setup Attendant', label: t('conferenceSetupAttendant') || 'Conference Setup Attendant', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Operations' },
    { id: 'Event Porter', label: t('eventPorter') || 'Event Porter', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Operations' },
    { id: 'Banquet Bartender', label: t('banquetBartender') || 'Banquet Bartender', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Operations' },
    { id: 'Event Server', label: t('eventServer') || 'Event Server', icon: GenericRoleIcon, dept: 'Events & Conferences', cat: 'Operations' },
    { id: 'Executive Assistant', label: t('executiveAssistant') || 'Executive Assistant', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Administrative' },
    { id: 'Administrative Assistant', label: t('adminAssistant') || 'Administrative Assistant', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Administrative' },
    { id: 'Office Manager', label: t('officeManager') || 'Office Manager', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Administrative' },
    { id: 'Data Entry Clerk', label: t('dataEntry') || 'Data Entry Clerk', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Clerical' },
    { id: 'Filing Clerk', label: t('filingClerk') || 'Filing Clerk', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Clerical' },
    { id: 'Mail Room Clerk', label: t('mailRoomClerk') || 'Mail Room Clerk', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Clerical' },
    { id: 'Document Controller', label: t('documentController') || 'Document Controller', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Clerical' },
    { id: 'Personal Assistant', label: t('personalAssistant') || 'Personal Assistant', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Secretarial' },
    { id: 'Secretary', label: t('secretary') || 'Secretary', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Secretarial' },
    { id: 'Office Clerk', label: t('clerk') || 'Office Clerk', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Secretarial' },
    { id: 'Administrative Coordinator', label: t('adminCoordinator') || 'Administrative Coordinator', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Support' },
    { id: 'Business Center Attendant', label: t('businessCenterAttendant') || 'Business Center Attendant', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Business Center' },
    { id: 'Business Center Manager', label: t('businessCenterManager') || 'Business Center Manager', icon: GenericRoleIcon, dept: 'Administration & Support', cat: 'Business Center' },
    { id: 'Guest Services Manager', label: t('guestServicesManager') || 'Guest Services Manager', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Guest Services' },
    { id: 'Guest Relations Officer', label: t('guestRelationsOfficer') || 'Guest Relations Officer', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Guest Services' },
    { id: 'Butler', label: t('butler') || 'Butler', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Guest Services' },
    { id: 'Floor Butler', label: t('floorButler') || 'Floor Butler', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Guest Services' },
    { id: 'Club Lounge Attendant', label: t('clubLoungeAttendant') || 'Club Lounge Attendant', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Guest Services' },
    { id: 'Executive Lounge Attendant', label: t('executiveLoungeAttendant') || 'Executive Lounge Attendant', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Guest Services' },
    { id: 'Transportation Manager', label: t('transportationManager') || 'Transportation Manager', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Transportation' },
    { id: 'Shuttle Driver', label: t('shuttleDriver') || 'Shuttle Driver', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Transportation' },
    { id: 'Limo Driver', label: t('limoDriver') || 'Limo Driver', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Transportation' },
    { id: 'Chauffeur', label: t('chauffeur') || 'Chauffeur', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Transportation' },
    { id: 'Parking Attendant', label: t('parkingAttendant') || 'Parking Attendant', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Parking' },
    { id: 'Valet Supervisor', label: t('valetSupervisor') || 'Valet Supervisor', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Parking' },
    { id: 'Gift Shop Manager', label: t('giftShopManager') || 'Gift Shop Manager', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Retail' },
    { id: 'Gift Shop Attendant', label: t('giftShopAttendant') || 'Gift Shop Attendant', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Retail' },
    { id: 'Newsstand Attendant', label: t('newsstandAttendant') || 'Newsstand Attendant', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Retail' },
    { id: 'Boutique Sales Associate', label: t('boutiqueSalesAssociate') || 'Boutique Sales Associate', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Retail' },
    { id: 'Theatre Desk Agent', label: t('theatreDeskAgent') || 'Theatre Desk Agent', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Concierge Services' },
    { id: 'Tour Desk Agent', label: t('tourDeskAgent') || 'Tour Desk Agent', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Concierge Services' },
    { id: 'Transportation Coordinator', label: t('transportationCoordinator') || 'Transportation Coordinator', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Concierge Services' },
    { id: 'Guest Recognition Manager', label: t('guestRecognitionManager') || 'Guest Recognition Manager', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Guest Recognition' },
    { id: 'Loyalty Program Coordinator', label: t('loyaltyProgramCoordinator') || 'Loyalty Program Coordinator', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Guest Recognition' },
    { id: 'Pet Concierge', label: t('petConcierge') || 'Pet Concierge', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Special Services' },
    { id: 'Family Concierge', label: t('familyConcierge') || 'Family Concierge', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Special Services' },
    { id: 'Accessibility Coordinator', label: t('accessibilityCoordinator') || 'Accessibility Coordinator', icon: GenericRoleIcon, dept: 'Additional Services', cat: 'Special Services' },
    { id: 'Beach Manager', label: t('beachManager') || 'Beach Manager', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Beach Operations' },
    { id: 'Beach Lifeguard', label: t('beachLifeguard') || 'Beach Lifeguard', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Beach Operations' },
    { id: 'Beach Butler', label: t('beachButler') || 'Beach Butler', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Beach Operations' },
    { id: 'Marina Manager', label: t('marinaManager') || 'Marina Manager', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Marina' },
    { id: 'Marina Attendant', label: t('marinaAttendant') || 'Marina Attendant', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Marina' },
    { id: 'Boat Captain', label: t('boatCaptain') || 'Boat Captain', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Marina' },
    { id: 'Water Sports Instructor', label: t('waterSportsInstructor') || 'Water Sports Instructor', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Marina' },
    { id: 'Scuba Diving Instructor', label: t('scubaDivingInstructor') || 'Scuba Diving Instructor', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Marina' },
    { id: 'Snorkeling Guide', label: t('snorkelingGuide') || 'Snorkeling Guide', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Marina' },
    { id: 'Ski Concierge', label: t('skiConcierge') || 'Ski Concierge', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Ski' },
    { id: 'Ski Valet', label: t('skiValet') || 'Ski Valet', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Ski' },
    { id: 'Golf Course Superintendent', label: t('golfCourseSuperintendent') || 'Golf Course Superintendent', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Golf' },
    { id: 'Golf Shop Attendant', label: t('golfShopAttendant') || 'Golf Shop Attendant', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Golf' },
    { id: 'Starter/Marshal', label: t('starterMarshal') || 'Starter/Marshal', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Golf' },
    { id: 'Caddie Master', label: t('caddieMaster') || 'Caddie Master', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Golf' },
    { id: 'Ranch Manager', label: t('ranchManager') || 'Ranch Manager', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Ranch' },
    { id: 'Wrangler', label: t('wrangler') || 'Wrangler', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Ranch' },
    { id: 'Trail Guide', label: t('trailGuide') || 'Trail Guide', icon: GenericRoleIcon, dept: 'Resort-Specific Roles', cat: 'Ranch' },
    { id: 'Casino Manager', label: t('casinoManager') || 'Casino Manager', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Management' },
    { id: 'Slot Manager', label: t('slotManager') || 'Slot Manager', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Management' },
    { id: 'Table Games Manager', label: t('tableGamesManager') || 'Table Games Manager', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Management' },
    { id: 'Slot Attendant', label: t('slotAttendant') || 'Slot Attendant', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Operations' },
    { id: 'Table Games Dealer', label: t('tableGamesDealer') || 'Table Games Dealer', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Operations' },
    { id: 'Pit Boss', label: t('pitBoss') || 'Pit Boss', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Operations' },
    { id: 'Cage Cashier', label: t('cageCashier') || 'Cage Cashier', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Operations' },
    { id: 'Keno Writer', label: t('kenoWriter') || 'Keno Writer', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Operations' },
    { id: 'Casino Security Officer', label: t('casinoSecurityOfficer') || 'Casino Security Officer', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Operations' },
    { id: 'Surveillance Operator', label: t('surveillanceOperator') || 'Surveillance Operator', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Operations' },
    { id: 'Showroom Manager', label: t('showroomManager') || 'Showroom Manager', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Casino Operations' },
    { id: 'Entertainment Booker', label: t('entertainmentBooker') || 'Entertainment Booker', icon: GenericRoleIcon, dept: 'Casino Hotel Roles', cat: 'Entertainment' },
    { id: 'Lifestyle Manager', label: t('lifestyleManager') || 'Lifestyle Manager', icon: GenericRoleIcon, dept: 'Boutique Hotel Roles', cat: 'Lifestyle' },
    { id: 'Experience Curator', label: t('experienceCurator') || 'Experience Curator', icon: GenericRoleIcon, dept: 'Boutique Hotel Roles', cat: 'Lifestyle' },
    { id: 'Neighborhood Concierge', label: t('neighborhoodConcierge') || 'Neighborhood Concierge', icon: GenericRoleIcon, dept: 'Boutique Hotel Roles', cat: 'Lifestyle' },
    { id: 'Design Director', label: t('designDirector') || 'Design Director', icon: GenericRoleIcon, dept: 'Boutique Hotel Roles', cat: 'Design' },
    { id: 'Interior Stylist', label: t('interiorStylist') || 'Interior Stylist', icon: GenericRoleIcon, dept: 'Boutique Hotel Roles', cat: 'Design' },
    { id: 'Programming Director', label: t('programmingDirector') || 'Programming Director', icon: GenericRoleIcon, dept: 'Boutique Hotel Roles', cat: 'Programming' },
    { id: 'Cultural Curator', label: t('culturalCurator') || 'Cultural Curator', icon: GenericRoleIcon, dept: 'Boutique Hotel Roles', cat: 'Programming' },
    { id: 'Artist in Residence Coordinator', label: t('artistResidenceCoordinator') || 'Artist in Residence Coordinator', icon: GenericRoleIcon, dept: 'Boutique Hotel Roles', cat: 'Programming' },
  ];



  const restaurantManagementRoles = [
    { id: 'Restaurant Manager RBB', label: t('restaurantManager') || 'Restaurant Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Bar Manager RBB', label: t('barManager') || 'Bar Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'FB Manager RBB', label: t('fbManager') || 'F&B Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Outlet Manager RBB', label: t('outletManager') || 'Outlet Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Banquet Manager RBB', label: t('banquetManager') || 'Banquet Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'HR Manager RBB', label: t('hrManager') || 'Human Resource Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Supervisor RBB', label: t('supervisor') || 'Supervisor', icon: ManagementIcon, cat: 'Management' },
    { id: 'Kitchen Manager RBB', label: t('kitchenManager') || 'Kitchen Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Catering Manager RBB', label: t('cateringManager') || 'Catering Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Event Coordinator RBB', label: t('eventCoordinator') || 'Event Coordinator', icon: ManagementIcon, cat: 'Management' },
    { id: 'Purchase Manager RBB', label: t('purchaseManager') || 'Purchase Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Store Manager RBB', label: t('storeManager') || 'Store Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Cost Controller RBB', label: t('costController') || 'Cost Controller', icon: ManagementIcon, cat: 'Management' },
    { id: 'Store Incharge RBB', label: t('storeIncharge') || 'Store Incharge', icon: ManagementIcon, cat: 'Management' },
    { id: 'Front Desk RBB', label: t('frontDesk') || 'Front Desk', icon: ManagementIcon, cat: 'Management' },
    { id: 'Asst Manager RBB', label: t('asstManager') || 'Asst Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Housekeeping Manager RBB', label: t('housekeepingManager') || 'Housekeeping Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Cleaning Supervisor RBB', label: t('cleaningSupervisor') || 'Cleaning Supervisor', icon: ManagementIcon, cat: 'Management' },
    { id: 'Chief Accountant RBB', label: t('chiefAccountant') || 'Chief Accountant', icon: ManagementIcon, cat: 'Management' },
    { id: 'Accounting Manager RBB', label: t('accountingManager') || 'Accounting Manager', icon: ManagementIcon, cat: 'Management' },
    { id: 'Parcel Supervisor RBB', label: t('parcelSupervisor') || 'Parcel Supervisor', icon: ManagementIcon, cat: 'Management' },
  ];

  const restaurantAdminAccountantRoles = [
    { id: 'Cashier RBB', label: t('cashier') || 'Cashier', icon: ManagementIcon, cat: 'Admin / Accountant' },
    { id: 'Billing RBB', label: t('billing') || 'Billing', icon: ManagementIcon, cat: 'Admin / Accountant' },
    { id: 'Admin Assistant RBB', label: t('adminAssistant') || 'Admin Assistant', icon: ManagementIcon, cat: 'Admin / Accountant' },
    { id: 'Receptionist RBB', label: t('receptionist') || 'Receptionist', icon: ManagementIcon, cat: 'Admin / Accountant' },
    { id: 'HR Assistant RBB', label: t('hrAssistant') || 'HR Assistant', icon: ManagementIcon, cat: 'Admin / Accountant' },
    { id: 'Clerk RBB', label: t('clerk') || 'Clerk', icon: ManagementIcon, cat: 'Admin / Accountant' },
    { id: 'Data Entry RBB', label: t('dataEntry') || 'Data Entry', icon: ManagementIcon, cat: 'Admin / Accountant' },
    { id: 'Store Assistant RBB', label: t('storeAssistant') || 'Store Assistant', icon: ManagementIcon, cat: 'Admin / Accountant' },
    { id: 'Purchase Assistant RBB', label: t('purchaseAssistant') || 'Purchase Assistant', icon: ManagementIcon, cat: 'Admin / Accountant' },
  ];

  const restaurantPurchaseStoreRoles = [
    { id: 'Service/Waiter RBB', label: t('serviceWaiter') || 'Service/Waiter', icon: GenericRoleIcon, cat: 'Purchase / Store' },
    { id: 'Food Runner RBB', label: t('foodRunner') || 'Food Runner', icon: GenericRoleIcon, cat: 'Purchase / Store' },
    { id: 'Captain RBB', label: t('captain') || 'Captain', icon: GenericRoleIcon, cat: 'Purchase / Store' },
    { id: 'Bar Tender RBB', label: t('barTender') || 'Bar Tender', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Bar Back RBB', label: t('barBack') || 'Bar Back', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Sommelier/Wine Steward RBB', label: t('sommelierWineSteward') || 'Sommelier/Wine Steward', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Mixologist RBB', label: t('mixologist') || 'Mixologist', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Barista RBB', label: t('barista') || 'Barista', icon: BarIcon, cat: 'Purchase / Store' },
    { id: 'Greeter RBB', label: t('greeter') || 'Greeter', icon: GenericRoleIcon, cat: 'Purchase / Store' },
    { id: 'Reservationist RBB', label: t('reservationist') || 'Reservationist', icon: CalendarIcon, cat: 'Purchase / Store' },
    { id: 'Counter/Parcel RBB', label: t('counterParcel') || 'Counter/Parcel', icon: GenericRoleIcon, cat: 'Purchase / Store' },
    { id: 'Buffet Attendant RBB', label: t('buffetAttendant') || 'Buffet Attendant', icon: GenericRoleIcon, cat: 'Purchase / Store' },
    { id: 'Event Planner RBB', label: t('eventPlanner') || 'Event Planner', icon: ManagementIcon, cat: 'Purchase / Store' },
  ];


  const restaurantKitchenOperationRoles = [
    { id: 'Executive Chef KO RBB', label: t('executiveChef') || 'Executive Chef', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Corporate Chef KO RBB', label: t('corporateChef') || 'Corporate Chef', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Sous Chef KO RBB', label: t('sousChef') || 'Sous Chef', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Culinary Director KO RBB', label: t('culinaryDirector') || 'Culinary Director', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: "Maitre d KO RBB", label: t('maitred') || "Maitre'd", icon: QAManagerIcon, cat: 'Kitchen/Operation' },
    { id: 'Chef de Cuisine KO RBB', label: t('chefDeCuisine') || 'Chef de Cuisine', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Commis 1 KO RBB', label: t('commis1') || 'Commis 1', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Commis 2 KO RBB', label: t('commis2') || 'Commis 2', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Commis 3 KO RBB', label: t('commis3') || 'Commis 3', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Line Cook KO RBB', label: t('lineCook') || 'Line Cook', icon: StoveIcon, cat: 'Kitchen/Operation' },
    { id: 'Fry Cook KO RBB', label: t('fryCook') || 'Fry Cook', icon: StoveIcon, cat: 'Kitchen/Operation' },
    { id: 'Pantry Cook KO RBB', label: t('pantryCook') || 'Pantry Cook', icon: StoveIcon, cat: 'Kitchen/Operation' },
    { id: 'Pantry Chef KO RBB', label: t('pantryChef') || 'Pantry Chef', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Pizza Chef KO RBB', label: t('pizzaChef') || 'Pizza Chef', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Sushi Chef KO RBB', label: t('sushiChef') || 'Sushi Chef', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'Kitchen Assistant KO RBB', label: t('kitchenAssistant') || 'Kitchen Assistant', icon: LineHelperIcon, cat: 'Kitchen/Operation' },
    { id: 'Vegetable Cutter KO RBB', label: t('vegetableCutter') || 'Vegetable Cutter', icon: CuttingCleaningIcon, cat: 'Kitchen/Operation' },
    { id: 'Kitchen Porter KO RBB', label: t('kitchenPorter') || 'Kitchen Porter', icon: LineHelperIcon, cat: 'Kitchen/Operation' },
    { id: 'Banquet Chef KO RBB', label: t('banquetChef') || 'Banquet Chef', icon: ChefHatIcon, cat: 'Kitchen/Operation' },
    { id: 'Chinese Master KO RBB', label: t('chineseChef') || 'Chinese Master', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'Tandoori Grill Chef KO RBB', label: t('tandoorChef') || 'Tandoori/Grill Chef', icon: StoveIcon, cat: 'Kitchen/Operation' },
    { id: 'South Indian Cook KO RBB', label: t('southIndianChef') || 'South Indian Cook', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'North Indian Cook KO RBB', label: t('northIndianChef') || 'North Indian Cook', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'Continental Cook KO RBB', label: t('continentalCook') || 'Continental Cook', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'Recipe Tester KO RBB', label: t('recipeTester') || 'Recipe Tester', icon: LabIcon, cat: 'Kitchen/Operation' },
    { id: 'Sweet Master KO RBB', label: t('sweetsMaker') || 'Sweet Master', icon: PastryIcon, cat: 'Kitchen/Operation' },
    { id: 'Savouries Master KO RBB', label: t('snacksMaster') || 'Savouries Master', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'Bakery Master KO RBB', label: t('bakeryChef') || 'Bakery Master', icon: PastryIcon, cat: 'Kitchen/Operation' },
    { id: 'Chocolate Artist KO RBB', label: t('chocolateArtist') || 'Chocolate Artist', icon: PastryIcon, cat: 'Kitchen/Operation' },
    { id: 'Tea Master KO RBB', label: t('teaMaster') || 'Tea Master', icon: CoffeeIcon, cat: 'Kitchen/Operation' },
    { id: 'Juice Master KO RBB', label: t('juiceMaker') || 'Juice Master', icon: CoffeeIcon, cat: 'Kitchen/Operation' },
    { id: 'Vada Bujji Bonda Master KO RBB', label: t('vadaBujjiBondaMaster') || 'Vada/Bujji/Bonda Master', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'Chat Master KO RBB', label: t('chatsMaker') || 'Chat Master', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'Dosa Parotta Master KO RBB', label: t('dosaMaster') || 'Dosa/Parotta Master', icon: FoodIcon, cat: 'Kitchen/Operation' },
    { id: 'Kitchen Helper KO RBB', label: t('kitchenHelper') || 'Kitchen Helper', icon: LineHelperIcon, cat: 'Kitchen/Operation' },
  ];

  const restaurantCleaningMaintenanceRoles = [
    { id: 'Dishwashing CM RBB', label: t('dishWasher') || 'Dish Washing', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'Kitchen Cleaning CM RBB', label: t('kitchenCleaning') || 'Kitchen Cleaning', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'RestRoom Cleaning CM RBB', label: t('restRoomCleaning') || 'RestRoom Cleaning', icon: BroomIcon, cat: 'Cleaning / Maintenance' },
    { id: 'Electrician Plumber CM RBB', label: t('electricianPlumber') || 'Electrician/Plumber', icon: ToolsIcon, cat: 'Cleaning / Maintenance' },
  ];

  const retailManagementRoles = [
    { id: 'Warehouse Manager RD', label: t('warehouseManager') || 'Warehouse Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Operations Manager RD', label: t('operationsManager') || 'Operations Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Shift Supervisor RD', label: t('shiftSupervisor') || 'Shift Supervisor', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Store Manager RD', label: t('storeManager') || 'Store Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Assistant Store Manager RD', label: t('assistantStoreManager') || 'Assistant Store Manager', icon: QASupervisorIcon, cat: 'Management' },
    { id: 'Department Manager RD', label: t('departmentManager') || 'Department Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Supplier Relations Manager RD', label: t('supplierRelationsManager') || 'Supplier Relations Manager', icon: QAManagerIcon, cat: 'Management' },
    { id: 'Procurement Manager RD', label: t('purchaseManager') || 'Procurement Manager', icon: QAManagerIcon, cat: 'Management' },
  ];

  const retailProcurementRoles = [
    { id: 'Buyer Purchasing Agent RD', label: t('buyerPurchasingAgent') || 'Buyer Purchasing Agent', icon: LineHelperIcon, cat: 'Procurement/Purchase' },
    { id: 'Sourcing Specialist RD', label: t('sourcingSpecialist') || 'Sourcing Specialist', icon: LineHelperIcon, cat: 'Procurement/Purchase' },
    { id: 'Vendor Coordinator RD', label: t('vendorCoordinator') || 'Vendor Coordinator', icon: LineHelperIcon, cat: 'Procurement/Purchase' },
    { id: 'Frozen Food Specialist RD', label: t('frozenFoodSpecialist') || 'Frozen Food Specialist', icon: FreezerIcon, cat: 'Procurement/Purchase' },
  ];

  const retailWarehouseInventoryRoles = [
    { id: 'Forklift Operator RD', label: t('forkliftOperator') || 'Forklift Operator', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Order Picker RD', label: t('orderPicker') || 'Order Picker', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Palletizer RD', label: t('palletizer') || 'Palletizer', icon: PackageIcon, cat: 'Warehouse/Inventory' },
    { id: 'Reach Truck Operator RD', label: t('reachTruckOperator') || 'Reach Truck Operator', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Receiver RD', label: t('receiver') || 'Receiver', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Dock Worker RD', label: t('dockWorker') || 'Dock Worker', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Unloader RD', label: t('unloader') || 'Unloader', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Checker RD', label: t('checker') || 'Checker', icon: QASupervisorIcon, cat: 'Warehouse/Inventory' },
    { id: 'Shipper RD', label: t('shipper') || 'Shipper', icon: PackageIcon, cat: 'Warehouse/Inventory' },
    { id: 'Loader RD', label: t('loader') || 'Loader', icon: PackageIcon, cat: 'Warehouse/Inventory' },
    { id: 'Dispatch Coordinator RD', label: t('dispatchCoordinator') || 'Dispatch Coordinator', icon: QAManagerIcon, cat: 'Warehouse/Inventory' },
    { id: 'Inventory Clerk RD', label: t('inventoryClerk') || 'Inventory Clerk', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Cycle Counter RD', label: t('cycleCounter') || 'Cycle Counter', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
    { id: 'Stock Keeper RD', label: t('stockKeeper') || 'Stock Keeper', icon: LineHelperIcon, cat: 'Warehouse/Inventory' },
  ];

  const retailLogisticsRoles = [
    { id: 'Truck Driver CDL RD', label: t('truckDriverCDL') || 'Truck Driver (CDL)', icon: PackageIcon, cat: 'Logistics and supply chain' },
    { id: 'Delivery Driver RD', label: t('deliveryDriver') || 'Delivery Driver', icon: PackageIcon, cat: 'Logistics and supply chain' },
    { id: 'Route Driver RD', label: t('routeDriver') || 'Route Driver', icon: PackageIcon, cat: 'Logistics and supply chain' },
    { id: 'Box Truck Driver RD', label: t('boxTruckDriver') || 'Box Truck Driver', icon: PackageIcon, cat: 'Logistics and supply chain' },
    { id: 'Fleet Manager RD', label: t('fleetManager') || 'Fleet Manager', icon: QAManagerIcon, cat: 'Logistics and supply chain' },
    { id: 'Dispatcher RD', label: t('dispatcher') || 'Dispatcher', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Route Planner RD', label: t('routePlanner') || 'Route Planner', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Fleet Maintenance Supervisor RD', label: t('fleetMaintenanceSupervisor') || 'Fleet Maintenance Supervisor', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Refrigeration Technician RD', label: t('refrigerationTechnician') || 'Refrigeration Technician', icon: ToolsIcon, cat: 'Logistics and supply chain' },
    { id: 'Temperature Monitor RD', label: t('temperatureMonitor') || 'Temperature Monitor', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Cold Room Supervisor RD', label: t('coldRoomSupervisor') || 'Cold Room Supervisor', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Logistics Coordinator RD', label: t('logisticsCoordinator') || 'Logistics Coordinator', icon: QASupervisorIcon, cat: 'Logistics and supply chain' },
    { id: 'Traffic Manager RD', label: t('trafficManager') || 'Traffic Manager', icon: QAManagerIcon, cat: 'Logistics and supply chain' },
    { id: 'Freight Broker RD', label: t('freightBroker') || 'Freight Broker', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Import Export Coordinator RD', label: t('importExportCoordinator') || 'Import/Export Coordinator', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Supply Chain Planner RD', label: t('supplyChainPlanner') || 'Supply Chain Planner', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Demand Planner RD', label: t('demandPlanner') || 'Demand Planner', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
    { id: 'Replenishment Analyst RD', label: t('replenishmentAnalyst') || 'Replenishment Analyst', icon: LineHelperIcon, cat: 'Logistics and supply chain' },
  ];

  const retailCustomerServiceRoles = [
    { id: 'Sales Associate RD', label: t('salesAssociate') || 'Sales Associate', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Stock Clerk RD', label: t('stockClerk') || 'Stock Clerk', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Shelf Stocker RD', label: t('shelfStocker') || 'Shelf Stocker', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Merchandiser RD', label: t('merchandiser') || 'Merchandiser', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Customer Service Representative RD', label: t('customerServiceRep') || 'Customer Service Representative', icon: FrontOfficeIcon, cat: 'Customer service and Sales' },
    { id: 'Greeter RD', label: t('greeter') || 'Greeter', icon: LineHelperIcon, cat: 'Customer service and Sales' },
    { id: 'Information Desk Clerk RD', label: t('infoDeskClerk') || 'Information Desk Clerk', icon: LineHelperIcon, cat: 'Customer service and Sales' },
  ];

  const retailEcommerceRoles = [
    { id: 'Ecommerce Manager RD', label: t('ecommerceManager') || 'E-commerce Manager', icon: QAManagerIcon, cat: 'E-Commerce & Digital' },
    { id: 'Online Order Picker RD', label: t('onlineOrderPicker') || 'Online Order Picker', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Curbside Attendant RD', label: t('curbsideAttendant') || 'Curbside Attendant', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Personal Shopper RD', label: t('personalShopper') || 'Personal Shopper', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Online Merchandiser RD', label: t('onlineMerchandiser') || 'Online Merchandiser', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Product Lister RD', label: t('productLister') || 'Product Lister', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
    { id: 'Content Creator RD', label: t('contentCreator') || 'Content Creator', icon: LineHelperIcon, cat: 'E-Commerce & Digital' },
  ];

  const retailComplianceRoles = [
    { id: 'Trade Compliance Specialist RD', label: t('tradeComplianceSpecialist') || 'Trade Compliance Specialist', icon: RegIcon, cat: 'Compliance' },
    { id: 'Customs Broker RD', label: t('customsBroker') || 'Customs Broker', icon: RegIcon, cat: 'Compliance' },
  ];

  const retailQualityRoles = [
    { id: 'Food Safety Auditor RD', label: t('foodSafetyAuditor') || 'Food Safety Auditor', icon: SafetyOfficerIcon, cat: 'Quality' },
    { id: 'Quality Inspector RD', label: t('qualityInspector') || 'Quality Inspector', icon: QASupervisorIcon, cat: 'Quality' },
  ];

  const retailAccountsRoles = [
    { id: 'Cashier RD', label: t('cashier') || 'Cashier', icon: CashRegisterIcon, cat: 'Accounts' },
    { id: 'Accountant RD', label: t('accountant') || 'Accountant', icon: QAManagerIcon, cat: 'Accounts' },
  ];

  const getRolesForType = (type: string) => {
    switch (type.trim()) {
      case 'Restaurant/Bakery/Bar': return [...restaurantManagementRoles, ...restaurantAdminAccountantRoles, ...restaurantPurchaseStoreRoles, ...restaurantKitchenOperationRoles, ...restaurantCleaningMaintenanceRoles];
      case 'Hotel & Accomodation': return hotelAndAccomodationRoles;
      case 'Food Processing Industry': return foodProcessingRoles;
      case 'Retail/Distribution': return [...retailManagementRoles, ...retailProcurementRoles, ...retailWarehouseInventoryRoles, ...retailLogisticsRoles, ...retailCustomerServiceRoles, ...retailEcommerceRoles, ...retailComplianceRoles, ...retailQualityRoles, ...retailAccountsRoles];
      case 'Laboratory/R&D': return labRdRoles;
      default: return [];
    }
  };

  const aggregatedRoles = businessTypesArray.flatMap(getRolesForType);

  const jobRoles = aggregatedRoles.length > 0
    ? Array.from(new Map(
      aggregatedRoles
        .filter((role: any) => selectedJobCategories.length === 0 || selectedJobCategories.includes(role.cat))
        .map(item => [item.id, item])
    ).values())
    : [];

  const calculateCompletion = () => {
    let count = 0;
    if (selectedJobCategories.length > 0) count++;
    if (selectedRoles.length > 0) count++;
    if (availability.length > 0) count++;
    if (city.trim()) count++;
    if (state.trim()) count++;
    if (locality.trim()) count++;
    if (expMin) count++;
    if (salaryMin && salaryMax) count++;
    if (vacancies) count++;
    if (leaves) count++;
    if (workingHours) count++;
    if (selectedLanguages.length > 0) count++;

    const stepProgress = Math.round((count / 12) * 50);
    return 50 + stepProgress;
  };

  const validate = () => {
    let isValid = true;
    let newErrors: { [key: string]: string } = {};

    if (selectedJobCategories.length === 0) {
      newErrors.category = t('validation.selectCategory') || "Please select at least one category";
      isValid = false;
    }

    if (selectedRoles.length === 0) {
      newErrors.role = t('validation.selectRole');
      isValid = false;
    }

    if (availability.length === 0) {
      newErrors.availability = t('validation.selectShift');
      isValid = false;
    }

    if (!city.trim()) { newErrors.city = t('validation.required'); isValid = false; }
    if (!state.trim()) { newErrors.state = t('validation.required'); isValid = false; }
    if (!locality.trim()) { newErrors.locality = t('validation.required'); isValid = false; }

    if (!expMin) { newErrors.experience = t('validation.required'); isValid = false; }
    if (!salaryMin || !salaryMax) { newErrors.salary = t('validation.required'); isValid = false; }
    if (vacancies === '') { newErrors.vacancies = t('validation.required'); isValid = false; }
    if (leaves === '') { newErrors.leaves = t('validation.required'); isValid = false; }
    if (workingHours === '') { newErrors.workingHours = t('validation.required'); isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validate()) {
      router.push('/hirer/job-success');
    }
  };

  const experienceRange = Array.from({ length: 50 }, (_, i) => i.toString());
  const vacanciesRange = Array.from({ length: 100 }, (_, i) => (i + 1).toString()); // 1 to 100
  const leavesRange = Array.from({ length: 10 }, (_, i) => i.toString()); // 0 to 9
  const workingHoursRange = Array.from({ length: 24 }, (_, i) => (i + 1).toString()); // 1 to 24

  const benefitOptions = [
    { id: 'Free Food', label: t('freeFood') || 'Free\nFood', icon: 'food-fork-drink' },
    { id: 'Free Accommodation', label: t('freeAccommodation') || 'Free\nAccommodation', icon: 'home-city-outline' },
    { id: 'PF', label: t('pf') || 'PF', icon: 'shield-check-outline' },
    { id: 'ESI', label: t('esi') || 'ESI', icon: 'medical-bag' },
    { id: 'Health Insurance', label: t('healthInsurance') || 'Health\nInsurance', icon: 'heart-pulse' },
    { id: 'Bonus', label: t('bonus') || 'Bonus', icon: 'gift-outline' },
    { id: 'Transport Facility', label: t('transportFacility') || 'Transport\nFacility', icon: 'bus' },
    { id: 'Uniform Provided', label: t('uniformProvided') || 'Uniform\nProvided', icon: 'tshirt-crew-outline' },
    { id: 'Overtime Pay', label: t('overtimePay') || 'Overtime\nPay', icon: 'clock-fast' },
    { id: 'Uniform', label: t('uniform') || 'Uniform', icon: 'hanger' },
    { id: 'Training', label: t('training') || 'Training', icon: 'school-outline' },
    { id: 'Paid Leave', label: t('paidLeave') || 'Paid\nLeave', icon: 'calendar-star' },
  ];

  const languageOptions = [
    { id: 'english', label: t('english') || 'English' },
    { id: 'hindi', label: t('hindi') || 'Hindi' },
    { id: 'tamil', label: t('tamil') || 'Tamil' },
    { id: 'telugu', label: t('telugu') || 'Telugu' },
    { id: 'kannada', label: t('kannada') || 'Kannada' },
    { id: 'malayalam', label: t('malayalam') || 'Malayalam' },
    { id: 'marathi', label: t('marathi') || 'Marathi' },
    { id: 'bengali', label: t('bengali') || 'Bengali' },
    { id: 'gujarati', label: t('gujarati') || 'Gujarati' },
    { id: 'punjabi', label: t('punjabi') || 'Punjabi' },
    { id: 'others', label: t('others') || 'Others' },
  ];



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.white }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="dark" />
      <AppHeader showBack={true} showCallSupport showLanguage />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.vibrantHeader}>
          <ProgressIndicator
            currentStep={2}
            totalSteps={2}
            percentage={calculateCompletion()}
            stepTitle={t('postJob')}
          />
          <View style={styles.headerHero}>
            <View style={styles.heroTextBox}>
              <Text style={styles.vibrantTitle}>{t('postJob')}</Text>
              <Text style={styles.vibrantSubtitle}>{t('postJobSubtitle')}</Text>
            </View>
            <View style={styles.heroIconBox}>
              <Briefcase size={60} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        </View>

        <FadeInView style={[styles.floatingWorkspace, isDesktop && styles.desktopContent]}>
          <View style={styles.islandSurface}>
            {/* Section 1: Role & Requirements */}
            <View style={styles.islandSection}>
              <View style={styles.sectionHeading}>
                <View style={[styles.accentRing, { borderColor: COLORS.primary }]} />
                <Text style={styles.islandSectionTitle} numberOfLines={2}>{t('roleRequirements')}</Text>
              </View>

              {/* Category Selection */}
              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={styles.modernLabel}>{t('jobCategory') || 'Job Category'} <Text style={styles.required}>*</Text></Text>
                </View>
                <TouchableOpacity
                  style={[styles.vibrantSelectBox, errors.category && selectedJobCategories.length === 0 && styles.inputError]}
                  onPress={() => setIsCategoryModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <MaterialCommunityIcons name="view-grid-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, selectedJobCategories.length === 0 && styles.placeholderText]}>
                      {selectedJobCategories.length > 0
                        ? `${selectedJobCategories.length} ${t('categoriesSelected')}`
                        : t('selectCategory')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                {errors.category && <Text style={styles.vibrantError}>{errors.category}</Text>}
              </View>

              {/* Role Selection */}
              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={styles.modernLabel}>{t('selectRole')} <Text style={styles.required}>*</Text></Text>
                </View>
                <TouchableOpacity
                  style={[styles.vibrantSelectBox, errors.role && selectedRoles.length === 0 && styles.inputError]}
                  onPress={() => setIsDropdownOpen(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <MaterialCommunityIcons name="briefcase-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, selectedRoles.length === 0 && styles.placeholderText]}>
                      {selectedRoles.length > 0
                        ? `${selectedRoles.length} ${t('rolesSelected')}`
                        : t('selectRole')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                {errors.role && <Text style={styles.vibrantError}>{errors.role}</Text>}
              </View>

              {/* Vacancies */}
              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('vacancies')} <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.vibrantSelectBox, { minHeight: 55 }, errors.vacancies && !vacancies && styles.inputError]}
                  onPress={() => setOpenVacancies(true)}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <User size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, !vacancies && styles.placeholderText]}>
                      {vacancies ? `${vacancies} ${t('positions')}` : t('choosePositions')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                {errors.vacancies && <Text style={styles.vibrantError}>{errors.vacancies}</Text>}
              </View>



              {/* Experience */}
              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('experience')} <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.vibrantSelectBox, { minHeight: 55 }, errors.experience && !expMin && styles.inputError]}
                  onPress={() => setOpenExpMin(true)}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <MaterialCommunityIcons name="briefcase-clock-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, !expMin && styles.placeholderText]}>
                      {expMin ? (expMin === '0' ? t('fresher') || 'Fresher' : `${expMin} ${t('years')}`) : t('experienceLevel')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                {errors.experience && <Text style={styles.vibrantError}>{errors.experience}</Text>}
              </View>

              <View style={styles.vibrantInputRow}>
                <View style={styles.labelRowWithBadge}>
                  <Text style={[styles.modernLabel, { flex: 1 }]} numberOfLines={1}>{t('requiredLanguages')}</Text>
                  <View style={styles.vibrantBadge}><Text style={styles.vibrantBadgeText}>{t('optional')}</Text></View>
                </View>
                <View style={styles.chipContainer}>
                  {[t('tamil'), t('english'), t('hindi'), t('telugu'), t('malayalam'), t('kannada')].map((lang) => {
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                          } else {
                            setSelectedLanguages([...selectedLanguages, lang]);
                          }
                        }}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{lang}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.languages && <Text style={styles.vibrantError}>{errors.languages}</Text>}
              </View>
            </View>

            {/* Section 2: Work & Offer */}
            <View style={styles.islandSection}>
              <View style={styles.sectionHeading}>
                <View style={[styles.accentRing, { borderColor: '#FF9800' }]} />
                <Text style={styles.islandSectionTitle} numberOfLines={2}>{t('workOffer')}</Text>
              </View>

              {/* Availability */}
              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('availability')} <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.vibrantSelectBox, errors.availability && availability.length === 0 && styles.inputError]}
                  onPress={() => setIsAvailabilityOpen(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, availability.length === 0 && styles.placeholderText]}>
                      {availability.length > 0
                        ? `${availability.length} ${t('shiftsSelected')}`
                        : t('SelectAvailability')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                {errors.availability && <Text style={styles.vibrantError}>{errors.availability}</Text>}
              </View>

              {/* Working Hours */}
              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('workingHours')} <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.vibrantSelectBox, { minHeight: 55 }, errors.workingHours && !workingHours && styles.inputError]}
                  onPress={() => setOpenHours(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <MaterialCommunityIcons name="clock-time-eight-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, !workingHours && styles.placeholderText]}>
                      {workingHours ? `${workingHours} ${t('hours')}` : t('chooseHours')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                {errors.workingHours && <Text style={styles.vibrantError}>{errors.workingHours}</Text>}
              </View>

              {/* Salary Section */}
              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('salaryRange')} <Text style={styles.required}>*</Text></Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.vibrantInputBox, errors.salary && !salaryMin && styles.inputError, { minHeight: 50 }]}>
                      <Text style={{ fontSize: 14, color: COLORS.secondary, fontWeight: '700', marginLeft: 10 }}>₹</Text>
                      <TextInput
                        style={styles.modernTextInput}
                        placeholder={t('min') || "Min"}
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="numeric"
                        value={salaryMin}
                        onChangeText={(val) => setSalaryMin(val.replace(/[^0-9]/g, ''))}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.vibrantInputBox, errors.salary && !salaryMax && styles.inputError, { minHeight: 50 }]}>
                      <Text style={{ fontSize: 14, color: COLORS.secondary, fontWeight: '700', marginLeft: 10 }}>₹</Text>
                      <TextInput
                        style={styles.modernTextInput}
                        placeholder={t('max') || "Max"}
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="numeric"
                        value={salaryMax}
                        onChangeText={(val) => setSalaryMax(val.replace(/[^0-9]/g, ''))}
                      />
                    </View>
                  </View>
                </View>
                {errors.salary && <Text style={styles.vibrantError}>{errors.salary}</Text>}
              </View>



              {/* Leaves */}
              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('monthlyLeaves')} <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.vibrantSelectBox, { minHeight: 55 }, errors.leaves && !leaves && styles.inputError]}
                  onPress={() => setOpenLeaves(true)}
                >
                  <View style={styles.vibrantSelectLeft}>
                    <View style={styles.vibrantIconCircle}>
                      <MaterialCommunityIcons name="calendar-blank" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.vibrantSelectText, !leaves && styles.placeholderText]}>
                      {leaves ? `${leaves} ${t('leavesPerMonth')}` : t('chooseLeaves')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                {errors.leaves && <Text style={styles.vibrantError}>{errors.leaves}</Text>}
              </View>

              {/* Benefits Checklist */}
              <View style={[styles.vibrantInputRow, { marginBottom: 32 }]}>
                <View style={[styles.labelRowWithBadge, { marginBottom: 12 }]}>
                  <Text style={[styles.modernLabel, { flex: 1, marginBottom: 0 }]} numberOfLines={1}>{t('additionalBenefits')}</Text>
                  <View style={styles.vibrantBadge}><Text style={styles.vibrantBadgeText}>{t('optional')}</Text></View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 }}>
                  {benefitOptions.map((item) => {
                    const isSelected = benefits.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.boxChip, isSelected && styles.boxChipSelected]}
                        onPress={() => {
                          if (isSelected) setBenefits(benefits.filter(id => id !== item.id));
                          else setBenefits([...benefits, item.id]);
                        }}
                      >
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={24}
                          color={isSelected ? COLORS.primary : COLORS.textLight}
                          style={{ marginBottom: 6 }}
                        />
                        <Text style={[styles.boxChipText, isSelected && styles.boxChipTextSelected]} numberOfLines={2} adjustsFontSizeToFit>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Section 3: Location & About */}
            <View style={styles.islandSection}>
              <View style={styles.sectionHeading}>
                <View style={[styles.accentRing, { borderColor: '#E91E63' }]} />
                <Text style={styles.islandSectionTitle} numberOfLines={2}>{t('locationAndAbout')}</Text>
              </View>

              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('address') || 'Address'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.vibrantInputBox, errors.locality && styles.inputError]}>
                  <TextInput
                    style={[styles.modernTextInput, { marginLeft: 0 }]}
                    placeholder={t('addressPlaceholder') || "Enter full address"}
                    placeholderTextColor={COLORS.textLight}
                    value={locality}
                    onChangeText={(text) => {
                      setLocality(text);
                      if (text && errors.locality) setErrors({ ...errors, locality: '' });
                    }}
                  />
                </View>
                {errors.locality && <Text style={styles.vibrantError}>{errors.locality}</Text>}
              </View>

              <View style={styles.vibrantInputRow}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modernLabel}>{t('city')} <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.vibrantInputBox, errors.city && styles.inputError, { minHeight: 50 }]}>
                      <TextInput
                        style={styles.modernTextInput}
                        placeholder={t('cityPlaceholder') || "e.g. Salem"}
                        placeholderTextColor={COLORS.textLight}
                        value={city}
                        onChangeText={(text) => {
                          setCity(text);
                          if (text && errors.city) setErrors({ ...errors, city: '' });
                        }}
                      />
                    </View>
                    {errors.city && <Text style={styles.vibrantError}>{errors.city}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modernLabel}>{t('state')} <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.vibrantInputBox, errors.state && styles.inputError, { minHeight: 50 }]}>
                      <TextInput
                        style={styles.modernTextInput}
                        placeholder={t('statePlaceholder') || "e.g. Tamil Nadu"}
                        placeholderTextColor={COLORS.textLight}
                        value={state}
                        onChangeText={(text) => {
                          setState(text);
                          if (text && errors.state) setErrors({ ...errors, state: '' });
                        }}
                      />
                    </View>
                    {errors.state && <Text style={styles.vibrantError}>{errors.state}</Text>}
                  </View>
                </View>
              </View>

              <View style={styles.vibrantInputRow}>
                <Text style={styles.modernLabel}>{t('jobDescription')}</Text>
                <View style={[styles.vibrantInputBox, { alignItems: 'flex-start', minHeight: 120, paddingVertical: 15 }]}>
                  <TextInput
                    style={[styles.modernTextInput, { marginLeft: 0, textAlignVertical: 'top' }]}
                    placeholder={t('enterJobDescription')}
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </FadeInView>
      </ScrollView>

      {/* Job Role Modal */}
      <Modal
        visible={isDropdownOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsDropdownOpen(false);
          setRoleSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('selectRole')}</Text>
                <Text style={styles.modalSubtitle}>{selectedRoles.length} {t('selected')}</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsDropdownOpen(false); setRoleSearch(''); }} style={styles.closeButton}>
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
              {jobRoles
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
                        if (errors.role) setErrors({ ...errors, role: '' });
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
              <PrimaryButton title={t('done') || "Done"} onPress={() => { setIsDropdownOpen(false); setRoleSearch(''); }} />
            </View>
          </View>
        </View>
      </Modal>

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
                        if (errors.category) setErrors({ ...errors, category: '' });
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

      {/* Availability Modal */}
      <Modal
        visible={isAvailabilityOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAvailabilityOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('availability')}</Text>
                <Text style={styles.modalSubtitle}>{availability.length} {t('selected')}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAvailabilityOpen(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {[t('morningShift'), t('eveningShift'), t('nightShift'), t('weekends'), t('partTime'), t('flexible'), t('fullTime')].map((shift) => {
                const isSelected = availability.includes(shift);
                return (
                  <TouchableOpacity
                    key={shift}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      if (isSelected) {
                        setAvailability(availability.filter(s => s !== shift));
                      } else {
                        setAvailability([...availability, shift]);
                      }
                      if (errors.availability) setErrors({ ...errors, availability: '' });
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
                        {shift}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
              <PrimaryButton title={t('done') || "Done"} onPress={() => setIsAvailabilityOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>


      {/* Language Modal */}
      <Modal
        visible={isLanguageModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsLanguageModalOpen(false);
          setLanguageSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('selectLanguages') || 'Select Language(s)'}</Text>
                <Text style={styles.modalSubtitle}>{selectedLanguages.length} {t('selected')}</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsLanguageModalOpen(false); setLanguageSearch(''); }} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Feather name="search" size={20} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('searchLanguage') || "Search language..."}
                placeholderTextColor={COLORS.textLight}
                value={languageSearch}
                onChangeText={setLanguageSearch}
              />
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {languageOptions
                .filter(lang => lang.label.toLowerCase().includes(languageSearch.toLowerCase()))
                .map((lang) => {
                  const isSelected = selectedLanguages.includes(lang.id);
                  return (
                    <TouchableOpacity
                      key={lang.id}
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedLanguages(selectedLanguages.filter(id => id !== lang.id));
                        } else {
                          setSelectedLanguages([...selectedLanguages, lang.id]);
                        }
                        if (errors.languages) setErrors({ ...errors, languages: '' });
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
                          {lang.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
              <PrimaryButton title={t('done')} onPress={() => { setIsLanguageModalOpen(false); setLanguageSearch(''); }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Working Hours Modal */}
      <Modal
        visible={openHours}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOpenHours(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('workingHours')}</Text>
                <Text style={styles.modalSubtitle}>{workingHours ? t('oneSelected') : t('noneSelected')}</Text>
              </View>
              <TouchableOpacity onPress={() => setOpenHours(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {workingHoursRange.map((num) => {
                const isSelected = workingHours === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setWorkingHours(num);
                      setOpenHours(false);
                      if (errors.workingHours) setErrors({ ...errors, workingHours: '' });
                    }}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
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
                        {num} {t('hours') || 'Hours'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Experience Min Modal */}
      <Modal
        visible={openExpMin}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOpenExpMin(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('minExperience')}</Text>
                <Text style={styles.modalSubtitle}>{expMin ? t('oneSelected') : t('noneSelected')}</Text>
              </View>
              <TouchableOpacity onPress={() => setOpenExpMin(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {experienceRange.map((num) => {
                const isSelected = expMin === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setExpMin(num);
                      setOpenExpMin(false);
                      if (errors.experience) setErrors({ ...errors, experience: '' });
                    }}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
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
                        {num === '0' ? (t('fresher') || 'Fresher') : `${num} ${parseInt(num) === 1 ? 'Year' : 'Years'}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Vacancies Modal */}
      <Modal
        visible={openVacancies}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOpenVacancies(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('vacancies')}</Text>
                <Text style={styles.modalSubtitle}>{vacancies ? t('oneSelected') : t('noneSelected')}</Text>
              </View>
              <TouchableOpacity onPress={() => setOpenVacancies(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {vacanciesRange.map((num) => {
                const isSelected = vacancies === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setVacancies(num);
                      setOpenVacancies(false);
                      if (errors.vacancies) setErrors({ ...errors, vacancies: '' });
                    }}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
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
                        {num} {t('vacancyCount')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Leaves Modal */}
      <Modal
        visible={openLeaves}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOpenLeaves(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '50%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('leaves')}</Text>
                <Text style={styles.modalSubtitle}>{leaves ? t('oneSelected') : t('noneSelected')}</Text>
              </View>
              <TouchableOpacity onPress={() => setOpenLeaves(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {leavesRange.map((num) => {
                const isSelected = leaves === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setLeaves(num);
                      setOpenLeaves(false);
                      if (errors.leaves) setErrors({ ...errors, leaves: '' });
                    }}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
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
                        {num} {t('leavesCount')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Footer Button */}
      <View style={[styles.footer, isDesktop && styles.desktopFooter, { paddingBottom: 50 }]}>
        <PrimaryButton
          title={t('continue')}
          onPress={handleNext}
          style={styles.continueButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  vibrantTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 34,
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
    color: COLORS.secondary,
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
    color: COLORS.secondary,
    fontWeight: '600',
    marginLeft: 14,
  },
  orbRoleSelector: {
    flexDirection: 'row',
    gap: 16,
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
    color: COLORS.secondary,
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
  vibrantError: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 12,
  },
  inputError: {
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '05',
  },
  required: {
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 16,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 8,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  roleOrb: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  roleOrbActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  orbIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  orbIconActive: {
    backgroundColor: COLORS.primary,
  },
  orbText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  orbTextActive: {
    color: COLORS.primary,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 1000,
    ...SHADOWS.medium,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  suggestionText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
  continueButton: {
    width: '100%',
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
  boxChip: {
    width: '31%',
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  boxChipSelected: {
    backgroundColor: COLORS.primary + '0A',
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  boxChipText: {
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  boxChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});