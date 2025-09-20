import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import './Registration.css';

const Registration = () => {
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: '',
      medicalHistory: ''
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .required('Name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
      age: Yup.number()
        .min(1, 'Age must be a positive number')
        .max(120, 'Age must be realistic')
        .required('Age is required'),
      medicalHistory: Yup.string()
        .max(500, 'Medical history must be less than 500 characters')
    }),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        // Send registration data to backend
        const response = await fetch('http://localhost:5000/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('Registration successful! Please login.');
          window.location.href = '/login';
        } else {
          setErrors({ general: data.message });
        }
      } catch (error) {
        setErrors({ general: 'Registration failed. Please try again.' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="registration-container">
      <div className="registration-form">
        <h2>Create Your Account</h2>
        <form onSubmit={formik.handleSubmit}>
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
            {formik.touched.name && formik.errors.name ? (
              <div className="error">{formik.errors.name}</div>
            ) : null}
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
            {formik.touched.email && formik.errors.email ? (
              <div className="error">{formik.errors.email}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
            />
            {formik.touched.password && formik.errors.password ? (
              <div className="error">{formik.errors.password}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.confirmPassword}
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
              <div className="error">{formik.errors.confirmPassword}</div>
            ) : null}
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
            {formik.touched.age && formik.errors.age ? (
              <div className="error">{formik.errors.age}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="medicalHistory">Medical History (optional)</label>
            <textarea
              id="medicalHistory"
              name="medicalHistory"
              rows="4"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.medicalHistory}
              placeholder="Any pre-existing conditions, allergies, or relevant medical information"
            />
            {formik.touched.medicalHistory && formik.errors.medicalHistory ? (
              <div className="error">{formik.errors.medicalHistory}</div>
            ) : null}
          </div>

          {formik.errors.general && (
            <div className="error general-error">{formik.errors.general}</div>
          )}

          <button type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Registration;