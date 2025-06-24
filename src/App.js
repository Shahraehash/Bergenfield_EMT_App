import React, { useState, useEffect } from 'react';
import { User, Upload, MapPin, Phone, FileText, Shield, Calendar, AlertCircle, CheckCircle, Menu, X, UserPlus } from 'lucide-react';
import protocolsData from './protocols.json';
import hospitalsData from './hospitals.json';
import initialUsersData from './users.json';

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

  const handleDownloadCPRCard = () => {
    if (currentUser.cprCard.fileData) {
      const link = document.createElement('a');
      link.href = currentUser.cprCard.fileData;
      link.download = currentUser.cprCard.fileName || 'cpr-card.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
                Demo: Use john.smith@bergenfieldemt.org with password "password123"
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
                {currentUser.email === 'admin@bergenfieldemt.org' && (
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Area Hospitals</h2>
              <div className="grid gap-4">
                {hospitals.map((hospital, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                      {hospital.trauma && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                          Trauma Center
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
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
                      <p className="text-gray-500">Distance: {hospital.distance}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> In a real implementation, this would include an interactive map showing hospital locations and real-time navigation.
                </p>
              </div>
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-600">Role: {user.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {user.cprCard.verified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-sm">
                            {user.cprCard.verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                        {!user.cprCard.verified && (
                          <button className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                            Verify CPR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BergenfieldEMTApp;
