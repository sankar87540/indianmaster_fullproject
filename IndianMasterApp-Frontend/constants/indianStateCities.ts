/**
 * Mapping of Indian States and Union Territories to their major cities/towns.
 * Used for the dependent City dropdown on the Job Posting form.
 */
export const INDIAN_STATE_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry',
    'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur', 'Vizianagaram', 'Eluru',
    'Ongole', 'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Chittoor',
    'Hindupur', 'Proddatur', 'Bhimavaram', 'Madanapalle', 'Guntakal', 'Dharmavaram',
    'Gudivada', 'Narasaraopet', 'Tadipatri', 'Amaravati',
  ],
  'Arunachal Pradesh': [
    'Itanagar', 'Naharlagun', 'Pasighat', 'Namsai', 'Bomdila', 'Ziro',
    'Along', 'Tezu', 'Aalo', 'Tawang', 'Roing', 'Changlang',
  ],
  'Assam': [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia',
    'Tezpur', 'Bongaigaon', 'Dhubri', 'Diphu', 'North Lakhimpur', 'Sivasagar',
    'Goalpara', 'Barpeta', 'Karimganj', 'Hailakandi', 'Kokrajhar', 'Nalbari',
    'Mangaldoi', 'Golaghat',
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga',
    'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chapra', 'Hajipur',
    'Sasaram', 'Bihar Sharif', 'Motihari', 'Sitamarhi', 'Samastipur', 'Aurangabad',
    'Jehanabad', 'Nawada', 'Siwan', 'Buxar', 'Kishanganj', 'Madhubani',
    'Supaul', 'Saharsa', 'Bettiah',
  ],
  'Chhattisgarh': [
    'Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Korba', 'Rajnandgaon',
    'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund', 'Dhamtari', 'Chirmiri',
    'Kanker', 'Kawardha', 'Kondagaon', 'Naila Janjgir', 'Mungeli',
  ],
  'Goa': [
    'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim',
    'Curchorem', 'Sanquelim', 'Canacona', 'Quepem', 'Valpoi',
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar',
    'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mehsana',
    'Bharuch', 'Valsad', 'Navsari', 'Surendranagar', 'Amreli', 'Bhuj',
    'Porbandar', 'Godhra', 'Palanpur', 'Veraval', 'Gandhidham', 'Botad',
    'Patan', 'Dahod', 'Jetpur', 'Ankleshwar',
  ],
  'Haryana': [
    'Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak',
    'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa',
    'Bahadurgarh', 'Jind', 'Thanesar', 'Kaithal', 'Rewari', 'Palwal',
    'Narnaul', 'Fatehabad',
  ],
  'Himachal Pradesh': [
    'Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Kullu', 'Hamirpur',
    'Una', 'Bilaspur', 'Chamba', 'Nahan', 'Palampur', 'Baddi',
    'Sundarnagar', 'Manali',
  ],
  'Jharkhand': [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar',
    'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda',
    'Phusro', 'Dumka', 'Chaibasa', 'Gumla', 'Lohardaga', 'Pakur',
  ],
  'Karnataka': [
    'Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi',
    'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Davangere', 'Bidar',
    'Udupi', 'Hassan', 'Dharwad', 'Chitradurga', 'Raichur', 'Kolar',
    'Mandya', 'Bagalkot', 'Chikkamagaluru', 'Gadag', 'Yadgir', 'Ramanagara',
    'Chamarajanagar', 'Chikkaballapura', 'Kodagu', 'Koppal',
  ],
  'Kerala': [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Palakkad',
    'Malappuram', 'Kannur', 'Kasaragod', 'Kottayam', 'Alappuzha', 'Pathanamthitta',
    'Idukki', 'Wayanad', 'Ernakulam', 'Manjeri', 'Thalassery', 'Tirur',
    'Kayamkulam', 'Ponnani', 'Changanassery', 'Perinthalmanna',
  ],
  'Madhya Pradesh': [
    'Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar',
    'Ratlam', 'Satna', 'Murwara', 'Singrauli', 'Dewas', 'Rewa',
    'Shivpuri', 'Burhanpur', 'Chhindwara', 'Morena', 'Bhind', 'Guna',
    'Sehore', 'Vidisha', 'Chhatarpur', 'Damoh', 'Mandsaur', 'Khargone',
    'Neemuch', 'Betul', 'Seoni', 'Shahdol', 'Hoshangabad',
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad',
    'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai', 'Pimpri-Chinchwad',
    'Kalyan', 'Vasai-Virar', 'Sangli', 'Jalgaon', 'Akola', 'Latur',
    'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji',
    'Jalna', 'Bhiwandi', 'Nanded', 'Satara', 'Ratnagiri', 'Yavatmal',
    'Osmanabad', 'Wardha', 'Bid', 'Buldhana',
  ],
  'Manipur': [
    'Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Senapati',
    'Ukhrul', 'Tamenglong', 'Chandel', 'Jiribam',
  ],
  'Meghalaya': [
    'Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Resubelpara',
    'Williamnagar', 'Khliehriat',
  ],
  'Mizoram': [
    'Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Lawngtlai',
    'Serchhip', 'Mamit',
  ],
  'Nagaland': [
    'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto',
    'Phek', 'Mon', 'Kiphire', 'Longleng', 'Peren',
  ],
  'Odisha': [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri',
    'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Bargarh', 'Jeypore',
    'Angul', 'Dhenkanal', 'Keonjhar', 'Paradip', 'Balangir', 'Sundargarh',
    'Kendujhar', 'Phulbani',
  ],
  'Punjab': [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur',
    'Mohali', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla',
    'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur',
    'Kapurthala', 'Fatehgarh Sahib',
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur',
    'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar',
    'Beawar', 'Merta', 'Sujangarh', 'Tonk', 'Barmer', 'Sawai Madhopur',
    'Nagaur', 'Churu', 'Jhunjhunu', 'Hanumangarh', 'Banswara', 'Bundi',
    'Chittorgarh', 'Dungarpur', 'Jaisalmer', 'Jhalawar', 'Karauli',
  ],
  'Sikkim': [
    'Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Jorethang',
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
    'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul', 'Thanjavur',
    'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil',
    'Kanchipuram', 'Kumarapalayam', 'Karaikkudi', 'Neyveli', 'Cuddalore',
    'Kumbakonam', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Gudiyatham',
    'Pudukkottai', 'Vaniyambadi', 'Ambur', 'Nagapattinam', 'Viluppuram',
    'Chengalpattu', 'Ariyalur', 'Perambalur', 'Namakkal', 'Dharapuram', 'Palani', 'Batlagundu',
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam',
    'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet',
    'Jagtial', 'Mancherial', 'Nirmal', 'Kamareddy', 'Sangareddy', 'Medak',
    'Wanaparthy', 'Bhongir', 'Secunderabad', 'Kothagudem',
  ],
  'Tripura': [
    'Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa',
    'Sonamura', 'Melaghar',
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad',
    'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Ghaziabad', 'Gorakhpur',
    'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Shahjahanpur',
    'Rampur', 'Modinagar', 'Hapur', 'Etawah', 'Mirzapur', 'Bulandshahr',
    'Loni', 'Jaunpur', 'Faizabad', 'Ayodhya', 'Sitapur', 'Hathras',
    'Rae Bareli', 'Mau', 'Bahraich', 'Unnao', 'Hardoi', 'Fatehpur',
    'Azamgarh', 'Banda', 'Chandausi', 'Ballia', 'Gonda',
  ],
  'Uttarakhand': [
    'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur',
    'Rishikesh', 'Kotdwar', 'Ramnagar', 'Pithoragarh', 'Nainital', 'Almora',
    'Mussoorie', 'Tehri',
  ],
  'West Bengal': [
    'Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda',
    'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian',
    'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur',
    'Cooch Behar', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura',
    'Purulia', 'Darjeeling', 'Alipurduar',
  ],

  // Union Territories
  'Andaman and Nicobar Islands': [
    'Port Blair', 'Diglipur', 'Rangat', 'Mayabunder', 'Car Nicobar',
  ],
  'Chandigarh': [
    'Chandigarh', 'Manimajra', 'Daria', 'Burail',
  ],
  'Dadra and Nagar Haveli and Daman and Diu': [
    'Daman', 'Diu', 'Silvassa', 'Amli', 'Khanvel',
  ],
  'Delhi': [
    'New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Pitampura', 'Saket',
    'Laxmi Nagar', 'Preet Vihar', 'Shahdara', 'Uttam Nagar', 'Vikaspuri',
    'Paschim Vihar', 'Vasant Kunj', 'Mayur Vihar', 'Karol Bagh', 'Connaught Place',
    'Chandni Chowk', 'Noida Extension', 'Narela', 'Bawana',
  ],
  'Jammu and Kashmir': [
    'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua',
    'Udhampur', 'Punch', 'Rajouri', 'Pulwama', 'Kupwara', 'Bandipora',
    'Ganderbal', 'Kulgam', 'Shopian', 'Budgam',
  ],
  'Ladakh': [
    'Leh', 'Kargil', 'Nubra', 'Zanskar', 'Drass',
  ],
  'Lakshadweep': [
    'Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Minicoy',
  ],
  'Puducherry': [
    'Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Oulgaret', 'Villianur',
  ],
};

/** Sorted list of all Indian States and Union Territories */
export const INDIAN_STATES = Object.keys(INDIAN_STATE_CITIES).sort();

/**
 * Get cities for a given state. Returns empty array if state not found.
 */
export function getCitiesForState(stateName: string): string[] {
  return INDIAN_STATE_CITIES[stateName] ?? [];
}
