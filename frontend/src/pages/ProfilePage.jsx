import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, changePassword } from '../store/slices/authSlice';
import { showToast } from '../store/slices/uiSlice';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { validateEmail, validateName, validatePhone } from '../utils';

/**
 * ProfilePage - User profile management
 */
const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { loading } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    const nameError = validateName(profileData.name);
    if (nameError) newErrors.name = nameError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await dispatch(updateProfile(profileData));
    if (result.payload?.user) {
      dispatch(showToast({ type: 'success', message: 'Profile updated!' }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await dispatch(changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    }));
    
    if (result.payload?.success) {
      dispatch(showToast({ type: 'success', message: 'Password changed!' }));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'addresses', label: 'Addresses' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
            
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
              <Input
                label="Full Name"
                value={profileData.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                error={errors.name}
              />
              
              <Input
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                error={errors.email}
                disabled
                helperText="Contact support to change email"
              />
              
              <Input
                label="Phone"
                value={profileData.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                error={errors.phone}
              />

              <Button type="submit" loading={loading}>
                Save Changes
              </Button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">Change Password</h2>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                error={errors.currentPassword}
              />
              
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                error={errors.newPassword}
              />
              
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
              />

              <Button type="submit" loading={loading}>
                Change Password
              </Button>
            </form>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Saved Addresses</h2>
              <Button size="sm">Add New</Button>
            </div>
            
            {user?.addresses?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {user.addresses.map((addr, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{addr.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {addr.line1}
                          {addr.line2 && `, ${addr.line2}`}
                          <br />
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-primary-600 text-sm">Edit</button>
                        <button className="text-red-600 text-sm">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No saved addresses yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
