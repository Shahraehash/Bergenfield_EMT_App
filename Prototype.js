import React, { useState } from 'react';
import { User, Upload, MapPin, Phone, FileText, Shield, Calendar, AlertCircle, CheckCircle, Menu, X } from 'lucide-react';

const BergenfieldEMTApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login');
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@bergenfieldemt.org',
      role: 'EMT-B',
      cprCard: { uploaded: true, expiry: '2025-12-15', verified: true },
      lastLogin: '2025-06-09'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@bergenfieldemt.org',
      role: 'Paramedic',
      cprCard: { uploaded: true, expiry: '2025-08-20', verified: false },
      lastLogin: '2025-06-08'
    }
  ]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sample hospital data for Bergen County area
  const hospitals = [
    {
      name: 'Holy Name Medical Center',
      address: '718 Teaneck Rd, Teaneck, NJ 07666',
      phone: '(201) 833-3000',
      trauma: true,
      distance: '2.1 miles'
    },
    {
      name: 'Hackensack University Medical Center',
      address: '30 Prospect Ave, Hackensack, NJ 07601',
      phone: '(551) 996-2000',
      trauma: true,
      distance: '4.8 miles'
    },
    {
      name: 'Englewood Hospital',
      address: '350 Engle St, Englewood, NJ 07631',
      phone: '(201) 894-3000',
      trauma: false,
      distance: '3.2 miles'
    },
    {
      name: 'Valley Hospital',
      address: '223 N Van Dien Ave, Ridgewood, NJ 07450',
      phone: '(201) 447-8000',
      trauma: false,
      distance: '6.1 miles'
    }
  ];

  // Sample NJ BLS protocols
  const protocols = [
    {
      id: 'CARD-1',
      title: 'Cardiac Arrest',
      category: 'Cardiac',
      content: 'Begin CPR immediately. Attach AED/Monitor. Establish IV/IO access. Epinephrine 1mg IV/IO every 3-5 minutes. Consider reversible causes (H\'s and T\'s).'
    },
    {
      id: 'RESP-1',
      title: 'Respiratory Distress',
      category: 'Respiratory',
      content: 'Assess airway, breathing, circulation. Administer oxygen as needed. Consider albuterol for bronchospasm. Prepare for advanced airway if indicated.'
    },
    {
      id: 'TRAU-1',
      title: 'Trauma Assessment',
      category: 'Trauma',
      content: 'Scene safety first. Primary assessment: ABCDE. Control bleeding. Immobilize spine if indicated. Rapid transport for trauma alerts.'
    },
    {
      id: 'ANES-1',
      title: 'Anaphylaxis',
      category: 'Allergic',
      content: 'Epinephrine 0.3mg IM (EpiPen). High-flow oxygen. IV access. Consider diphenhydramine 25-50mg IV. Transport immediately.'
    },
    {
      id: 'SEIZ-1',
      title: 'Seizures',
      category: 'Neurological',
      content: 'Protect airway. Do not restrain. Check glucose. If status epilepticus: Midazolam 5mg IN/IM or Lorazepam 2mg IV.'
    }
  ];

  const handleLogin = () => {
    // Simulate login - in real app, this would authenticate with backend
    const user = users.find(u => u.email === loginForm.email);
    if (user) {
      setCurrentUser(user);
      setActiveTab('dashboard');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // In real app, this would upload to server
      setTimeout(() => {
        setCurrentUser(prev => ({
          ...prev,
          cprCard: { ...prev.cprCard, uploaded: true, verified: false }
        }));
        setSelectedFile(null);
      }, 1000);
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
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            Demo: Use john.smith@bergenfieldemt.org or sarah.j@bergenfieldemt.org
          </div>
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
                    {currentUser.cprCard.uploaded ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium">Card Uploaded</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Expires: {currentUser.cprCard.expiry}
                        </p>
                        <div className="flex items-center space-x-2">
                          {currentUser.cprCard.verified ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-700">Verified</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-yellow-700">Pending Verification</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-3">Upload your CPR certification</p>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="cpr-upload"
                        />
                        <label
                          htmlFor="cpr-upload"
                          className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer transition-colors"
                        >
                          Choose File
                        </label>
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