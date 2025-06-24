import React, { useState, useEffect } from 'react';
import { User, Upload, MapPin, Phone, FileText, Shield, Calendar, AlertCircle, CheckCircle, Menu, X, UserPlus, Navigation, Clock } from 'lucide-react';
import protocolsData from './protocols.json';
import hospitalsData from './hospitals.json';
import initialUsersData from './users.json';
import HospitalMap from './components/HospitalMap';
import { getCurrentPosition } from './utils/geolocation';
import { calculateHospitalDistances } from './utils/distance';

const BergenfieldEMTApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login');
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [users, setUsers] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [createAccountForm, setCreateAccountForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    role: 'EMT-B' 
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [hospitalsWithDistances, setHospitalsWithDistances] = useState(hospitalsData);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showMap, setShowMap] = useState(true);

  // Load users from localStorage and merge with initial data
  useEffect(() => {
    const savedUsers = localStorage.getItem('emtAppUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Initialize with users from JSON file
      setUsers(initialUsersData);
      localStorage.setItem('emtAppUsers', JSON.stringify(initialUsersData));
    }
  }, []);

  // Save users to localStorage whenever users array changes
  const saveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('emtAppUsers', JSON.stringify(updatedUsers));
  };

  // Import hospital data from JSON file
  const hospitals = hospitalsData;

  // Import NJ BLS protocols from JSON file
  const protocols = protocolsData;

  const handleLogin = () => {
    setError('');
    // Check if user exists and password matches
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      // Update last login
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? { ...u, lastLogin: new Date().toISOString().split('T')[0] }
          : u
      );
      saveUsers(updatedUsers);
      setCurrentUser({ ...user, lastLogin: new Date().toISOString().split('T')[0] });
      setActiveTab('dashboard');
      setLoginForm({ email: '', password: '' });
    } else {
      setError('Invalid email or password');
    }
  };

  const handleCreateAccount = () => {
    setError('');
    setSuccess('');

    // Validation
    if (!createAccountForm.name || !createAccountForm.email || !createAccountForm.password) {
      setError('Please fill in all fields');
      return;
    }

    if (createAccountForm.password !== createAccountForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (createAccountForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Check if email already exists
    if (users.find(u => u.email === createAccountForm.email)) {
      setError('An account with this email already exists');
      return;
    }

    // Create new user
    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      name: createAccountForm.name,
      email: createAccountForm.email,
      password: createAccountForm.password, // In real app, this would be hashed
      role: createAccountForm.role,
      cprCard: { uploaded: false, expiry: '', verified: false },
      lastLogin: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    // Add to users array and save
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    setSuccess('Account created successfully! You can now sign in.');
    setCreateAccountForm({ name: '', email: '', password: '', confirmPassword: '', role: 'EMT-B' });
    setShowCreateAccount(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file only');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        
        // Update current user with CPR card info
        const updatedUser = {
          ...currentUser,
          cprCard: {
            uploaded: true,
            fileName: file.name,
            fileData: base64String,
            uploadDate: new Date().toISOString(),
            expiry: '', // Will be set by user
            verified: false // Pending verification
          }
        };

        // Update users array and save to localStorage
        const updatedUsers = users.map(u => 
          u.id === currentUser.id ? updatedUser : u
        );
        saveUsers(updatedUsers);
        setCurrentUser(updatedUser);
        setSelectedFile(null);
        setSuccess('CPR card uploaded successfully! Please set the expiry date.');
      };

      reader.onerror = () => {
        setError('Error reading file. Please try again.');
        setSelectedFile(null);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSetExpiry = (expiry) => {
    const updatedUser = {
      ...currentUser,
      cprCard: { ...currentUser.cprCard, expiry }
    };
    
    const updatedUsers = users.map(u => 
      u.id === currentUser.id ? updatedUser : u
    );
    saveUsers(updatedUsers);
    setCurrentUser(updatedUser);
  };

  const handleDownloadCPRCard = (user = currentUser) => {
    if (user.cprCard.fileData) {
      const link = document.createElement('a');
      link.href = user.cprCard.fileData;
      link.download = user.cprCard.fileName || `${user.name.replace(/\s+/g, '_')}_cpr_card.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleVerifyCPR = (userId) => {
    const updatedUsers = users.map(u => 
      u.id === userId 
        ? { ...u, cprCard: { ...u.cprCard, verified: true, verifiedDate: new Date().toISOString() } }
        : u
    );
    saveUsers(updatedUsers);
    
    // Update current user if they are the one being verified
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ 
        ...prev, 
        cprCard: { ...prev.cprCard, verified: true, verifiedDate: new Date().toISOString() } 
      }));
    }
    
    setSuccess('CPR certification verified successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Location and hospital distance functions
  const handleGetLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    
    try {
      const position = await getCurrentPosition();
      setUserLocation(position);
      
      // Calculate distances to hospitals
      const hospitalsWithCalculatedDistances = await calculateHospitalDistances(position, hospitals);
      setHospitalsWithDistances(hospitalsWithCalculatedDistances);
      
      setLocationLoading(false);
    } catch (error) {
      setLocationError(error.message);
      setLocationLoading(false);
      // Still show hospitals with original distances if location fails
      setHospitalsWithDistances(hospitals);
    }
  };

  // Auto-request location when hospitals tab is accessed
  useEffect(() => {
    if (activeTab === 'hospitals' && !userLocation && !locationLoading) {
      handleGetLocation();
    }
  }, [activeTab]);

  const TabButton = ({ tab, icon: Icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        active 
          ? 'bg-red-600 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={18} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bergenfield EMT</h1>
            <p className="text-gray-600">Emergency Services Portal</p>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {!showCreateAccount ? (
            // Login Form
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="your.email@bergenfieldemt.org"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <button
                onClick={handleLogin}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Sign In
              </button>

              <button
                onClick={() => {
                  setShowCreateAccount(true);
                  setError('');
                  setSuccess('');
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <UserPlus size={18} />
                <span>Create Account</span>
              </button>
              
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Demo accounts:</p>
                <p>User: john.smith@bergenfieldemt.org / password123</p>
                <p>Admin: admin@bergenfieldemt.org / admin123</p>
              </div>
            </div>
          ) : (
            // Create Account Form
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Create New Account</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={createAccountForm.name}
                  onChange={(e) => setCreateAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={createAccountForm.email}
                  onChange={(e) => setCreateAccountForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="your.email@bergenfieldemt.org"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={createAccountForm.role}
                  onChange={(e) => setCreateAccountForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="EMT-B">EMT-B</option>
                  <option value="EMT-A">EMT-A</option>
                  <option value="Paramedic">Paramedic</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={createAccountForm.password}
                  onChange={(e) => setCreateAccountForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter password (min 6 characters)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={createAccountForm.confirmPassword}
                  onChange={(e) => setCreateAccountForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateAccount}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Create Account
                </button>
                <button
                  onClick={() => {
                    setShowCreateAccount(false);
                    setError('');
                    setSuccess('');
                    setCreateAccountForm({ name: '', email: '', password: '', confirmPassword: '', role: 'EMT-B' });
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bergenfield EMT</h1>
                <p className="text-sm text-gray-600">Welcome, {currentUser.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <TabButton
                  tab="dashboard"
                  icon={User}
                  label="Dashboard"
                  active={activeTab === 'dashboard'}
                  onClick={() => setActiveTab('dashboard')}
                />
                <TabButton
                  tab="hospitals"
                  icon={MapPin}
                  label="Hospitals"
                  active={activeTab === 'hospitals'}
                  onClick={() => setActiveTab('hospitals')}
                />
                <TabButton
                  tab="protocols"
                  icon={FileText}
                  label="Protocols"
                  active={activeTab === 'protocols'}
                  onClick={() => setActiveTab('protocols')}
                />
                {currentUser.role === 'Admin' && (
                  <TabButton
                    tab="admin"
                    icon={Shield}
                    label="Admin"
                    active={activeTab === 'admin'}
                    onClick={() => setActiveTab('admin')}
                  />
                )}
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              <button
                onClick={() => setCurrentUser(null)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-2">
              <TabButton
                tab="dashboard"
                icon={User}
                label="Dashboard"
                active={activeTab === 'dashboard'}
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              />
              <TabButton
                tab="hospitals"
                icon={MapPin}
                label="Hospitals"
                active={activeTab === 'hospitals'}
                onClick={() => { setActiveTab('hospitals'); setMobileMenuOpen(false); }}
              />
              <TabButton
                tab="protocols"
                icon={FileText}
                label="Protocols"
                active={activeTab === 'protocols'}
                onClick={() => { setActiveTab('protocols'); setMobileMenuOpen(false); }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {currentUser.name}</p>
                    <p><span className="font-medium">Email:</span> {currentUser.email}</p>
                    <p><span className="font-medium">Role:</span> {currentUser.role}</p>
                    <p><span className="font-medium">Last Login:</span> {currentUser.lastLogin}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">CPR Certification</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {!currentUser.cprCard.uploaded ? (
                      // Error state - No CPR card uploaded
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-sm font-medium text-red-700">Error: Please upload CPR card</span>
                        </div>
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-3">Upload your CPR certification (PDF only)</p>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="cpr-upload"
                          />
                          <label
                            htmlFor="cpr-upload"
                            className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer transition-colors"
                          >
                            Upload PDF
                          </label>
                        </div>
                      </div>
                    ) : (
                      // Card uploaded - show status and expiry
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium">CPR Card Uploaded</span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p><strong>File:</strong> {currentUser.cprCard.fileName}</p>
                          <p><strong>Uploaded:</strong> {new Date(currentUser.cprCard.uploadDate).toLocaleDateString()}</p>
                        </div>

                        {/* Expiry Date Input */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={currentUser.cprCard.expiry}
                            onChange={(e) => handleSetExpiry(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                          />
                        </div>

                        {/* Verification Status */}
                        <div className="flex items-center space-x-2">
                          {currentUser.cprCard.verified ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-700">Verified</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-orange-700">Pending Verification</span>
                            </>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={handleDownloadCPRCard}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            Download PDF
                          </button>
                          <label
                            htmlFor="cpr-upload-replace"
                            className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            Replace PDF
                          </label>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="cpr-upload-replace"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div className="space-y-6">
            {/* Location Status */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Location Services</h3>
                    {locationLoading && (
                      <p className="text-sm text-blue-600">Getting your location...</p>
                    )}
                    {userLocation && !locationLoading && (
                      <p className="text-sm text-green-600">
                        Location found - showing distances from your position
                      </p>
                    )}
                    {locationError && (
                      <p className="text-sm text-red-600">{locationError}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGetLocation}
                    disabled={locationLoading}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {locationLoading ? 'Getting Location...' : 'Update Location'}
                  </button>
                  
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    {showMap ? 'Show List' : 'Show Map'}
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            {showMap && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Hospital Locations</h2>
                <HospitalMap
                  hospitals={hospitalsWithDistances}
                  userLocation={userLocation}
                  className="h-96 w-full rounded-lg border"
                />
              </div>
            )}

            {/* Hospital List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Area Hospitals {userLocation && '(Sorted by Distance)'}
                </h2>
                {userLocation && (
                  <div className="text-sm text-gray-600">
                    From your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </div>
                )}
              </div>
              
              <div className="grid gap-4">
                {hospitalsWithDistances.map((hospital, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                      <div className="flex items-center space-x-2">
                        {hospital.trauma && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                            Trauma Center
                          </span>
                        )}
                        {index === 0 && userLocation && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                            Closest
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{hospital.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${hospital.phone}`} className="text-red-600 hover:text-red-700">
                          {hospital.phone}
                        </a>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">Distance: {hospital.distance}</span>
                        </div>
                        {hospital.travelTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Travel: {hospital.travelTime}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {userLocation && (
                      <div className="flex space-x-2">
                        <a
                          href={`https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${hospital.coordinates[0]},${hospital.coordinates[1]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Directions</span>
                        </a>
                        <a
                          href={`tel:${hospital.phone}`}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {!userLocation && !locationLoading && (
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Allow location access to see real driving distances and get turn-by-turn directions to hospitals.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">NJ BLS Medical Protocols</h2>
              <div className="space-y-4">
                {protocols.map((protocol) => (
                  <div key={protocol.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{protocol.title}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        {protocol.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{protocol.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Protocol ID: {protocol.id}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Disclaimer:</strong> These are simplified examples. Actual NJ BLS protocols should be obtained from official sources and include complete medical direction guidelines.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">User Management Dashboard</h2>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <User className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Users</p>
                      <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Verified CPR</p>
                      <p className="text-2xl font-bold text-green-900">
                        {users.filter(u => u.cprCard.verified).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {users.filter(u => !u.cprCard.verified && u.cprCard.uploaded).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Upload className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-600">No CPR Card</p>
                      <p className="text-2xl font-bold text-red-900">
                        {users.filter(u => !u.cprCard.uploaded).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User List */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">All Users</h3>
                {users.filter(u => u.role !== 'Admin').map((user) => {
                  const isExpiringSoon = user.cprCard.expiry && 
                    new Date(user.cprCard.expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  const isExpired = user.cprCard.expiry && 
                    new Date(user.cprCard.expiry) < new Date();

                  return (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                              {user.role}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Email:</strong> {user.email}</p>
                              <p><strong>Last Login:</strong> {user.lastLogin}</p>
                            </div>
                            
                            <div>
                              <p><strong>CPR Status:</strong> 
                                <span className={`ml-1 ${
                                  user.cprCard.verified ? 'text-green-600' : 
                                  user.cprCard.uploaded ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {user.cprCard.verified ? 'Verified' : 
                                   user.cprCard.uploaded ? 'Pending Verification' : 'Not Uploaded'}
                                </span>
                              </p>
                              
                              {user.cprCard.expiry && (
                                <p><strong>CPR Expires:</strong> 
                                  <span className={`ml-1 ${
                                    isExpired ? 'text-red-600 font-semibold' :
                                    isExpiringSoon ? 'text-yellow-600 font-semibold' : 'text-gray-600'
                                  }`}>
                                    {new Date(user.cprCard.expiry).toLocaleDateString()}
                                    {isExpired && ' (EXPIRED)'}
                                    {isExpiringSoon && !isExpired && ' (Expires Soon)'}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          {/* Verification Status Badge */}
                          <div className="flex items-center space-x-2">
                            {user.cprCard.verified ? (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-700 font-medium">Verified</span>
                              </div>
                            ) : user.cprCard.uploaded ? (
                              <div className="flex items-center space-x-1">
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-yellow-700 font-medium">Pending</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-red-700 font-medium">No CPR Card</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-1">
                            {user.cprCard.uploaded && user.cprCard.fileData && (
                              <button
                                onClick={() => handleDownloadCPRCard(user)}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Download PDF</span>
                              </button>
                            )}
                            
                            {user.cprCard.uploaded && !user.cprCard.verified && (
                              <button
                                onClick={() => handleVerifyCPR(user.id)}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Verify CPR</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {users.filter(u => u.role !== 'Admin').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BergenfieldEMTApp;
