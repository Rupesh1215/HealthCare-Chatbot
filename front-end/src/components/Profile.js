import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import './Profile.css';

const Profile = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Safe user data extraction
  const safeUser = user || {};
  const safeUserData = {
    name: typeof safeUser.name === 'string' ? safeUser.name : '',
    email: typeof safeUser.email === 'string' ? safeUser.email : '',
    age: typeof safeUser.age === 'number' ? safeUser.age : typeof safeUser.age === 'string' ? parseInt(safeUser.age) || '' : '',
    medicalHistory: typeof safeUser.medicalHistory === 'string' ? safeUser.medicalHistory : '',
    created_at: safeUser.created_at
  };

  const formik = useFormik({
    initialValues: {
      name: safeUserData.name,
      email: safeUserData.email,
      age: safeUserData.age,
      medicalHistory: safeUserData.medicalHistory
    },
    validationSchema: Yup.object({
      name: Yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      age: Yup.number().min(1, 'Age must be positive').max(120, 'Age must be realistic').required('Age is required'),
      medicalHistory: Yup.string().max(500, 'Medical history must be less than 500 characters')
    }),
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(values),
        });
        
        if (response.ok) {
          setSuccessMessage('Profile updated successfully!');
          setIsEditing(false);
          setTimeout(() => setSuccessMessage(''), 3000);
          
          const updatedUser = { ...safeUser, ...values };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        {!isEditing && (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="profile-content">
        {isEditing ? (
          <form onSubmit={formik.handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
              />
              {formik.touched.name && formik.errors.name && (
                <div className="error">{formik.errors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="error">{formik.errors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.age}
              />
              {formik.touched.age && formik.errors.age && (
                <div className="error">{formik.errors.age}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="medicalHistory">Medical History</label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                rows="4"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.medicalHistory}
                placeholder="Any pre-existing conditions, allergies, or relevant medical information"
              />
              {formik.touched.medicalHistory && formik.errors.medicalHistory && (
                <div className="error">{formik.errors.medicalHistory}</div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" disabled={formik.isSubmitting}>
                {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-item">
              <label>Name:</label>
              <span>{safeUserData.name || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Email:</label>
              <span>{safeUserData.email || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Age:</label>
              <span>{safeUserData.age || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Medical History:</label>
              <span>{safeUserData.medicalHistory || 'None provided'}</span>
            </div>
            <div className="detail-item">
              <label>Member Since:</label>
              <span>{safeUserData.created_at ? new Date(safeUserData.created_at).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;