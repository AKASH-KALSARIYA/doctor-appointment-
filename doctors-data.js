// Local doctors data (fallback when Firebase is not available)
window.doctorsData = [
    {
        id: '1',
        name: 'Dr. Amit Sharma',
        specialization: 'General Physician',
        qualification: 'MBBS, MD',
        experience: 12,
        fees: 500,
        availability: 'Mon-Fri, 9AM-6PM',
        location: 'Rural Health Center',
        rating: 4.8,
        languages: ['Hindi', 'English'],
        bio: 'Experienced physician with 12 years of service in rural healthcare.',
        contact: '+91 9876543210',
        email: 'amit.sharma@example.com',
        imageUrl: 'raja.jpg'
    },
    {
        id: '2',
        name: 'Dr. Sunita Verma',
        specialization: 'Gynecologist',
        qualification: 'MBBS, DGO',
        experience: 8,
        fees: 600,
        availability: 'Mon-Sat, 10AM-4PM',
        location: 'Women Health Clinic',
        rating: 4.9,
        languages: ['Hindi', 'English', 'Local Dialect'],
        bio: 'Specialized in women\'s health with focus on rural communities.',
        contact: '+91 9876543211',
        email: 'sunita.verma@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop'
    },
    {
        id: '3',
        name: 'Dr. Rajesh Kumar',
        specialization: 'Pediatrician',
        qualification: 'MBBS, DCH',
        experience: 10,
        fees: 450,
        availability: 'Tue-Sat, 11AM-5PM',
        location: 'Child Care Center',
        rating: 4.7,
        languages: ['Hindi', 'English'],
        bio: 'Dedicated pediatrician serving rural children for 10 years.',
        contact: '+91 9876543212',
        email: 'rajesh.kumar@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop'
    },
    {
        id: '4',
        name: 'Dr. Priya Singh',
        specialization: 'Dentist',
        qualification: 'BDS, MDS',
        experience: 6,
        fees: 400,
        availability: 'Mon-Fri, 9AM-5PM',
        location: 'Dental Care Unit',
        rating: 4.6,
        languages: ['Hindi', 'English'],
        bio: 'Providing dental care services in rural areas.',
        contact: '+91 9876543213',
        email: 'priya.singh@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop'
    },
    {
        id: '5',
        name: 'Dr. Anil Patel',
        specialization: 'Orthopedic',
        qualification: 'MBBS, MS (Ortho)',
        experience: 15,
        fees: 700,
        availability: 'Wed-Sun, 10AM-6PM',
        location: 'Bone & Joint Clinic',
        rating: 4.9,
        languages: ['Hindi', 'Gujarati', 'English'],
        bio: 'Specialized in bone and joint problems common in rural areas.',
        contact: '+91 9876543214',
        email: 'anil.patel@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop'
    },
    {
        id: '6',
        name: 'Dr. Meera Nair',
        specialization: 'Ayurveda',
        qualification: 'BAMS, MD (Ayurveda)',
        experience: 9,
        fees: 350,
        availability: 'Mon-Sat, 8AM-4PM',
        location: 'Ayurveda Center',
        rating: 4.8,
        languages: ['Hindi', 'Malayalam', 'English'],
        bio: 'Practicing traditional Ayurveda medicine for rural wellness.',
        contact: '+91 9876543215',
        email: 'meera.nair@example.com',
        imageUrl: 'doctor3.jpg'
    },
    
    {
        id: '17',
        name: 'Dr. Mohan Sharma',
        specialization: 'General Surgeon',
        qualification: 'MBBS, MS (General Surgery)',
        experience: 16,
        fees: 1100,
        availability: 'Mon-Fri, 9AM-6PM',
        location: 'Surgical Care Hospital',
        rating: 4.9,
        languages: ['Hindi', 'English'],
        bio: 'Expert in general surgical procedures, laparoscopic surgeries, and emergency surgeries.',
        contact: '+91 9876543226',
        email: 'mohan.sharma@example.com',
        imageUrl: 'doctor7.jpg'
    },
    {
        id: '18',
        name: 'Dr. Pooja Verma',
        specialization: 'Endocrinologist',
        qualification: 'MBBS, MD (Medicine), DM (Endocrinology)',
        experience: 10,
        fees: 850,
        availability: 'Tue-Sat, 10AM-5PM',
        location: 'Diabetes & Hormone Center',
        rating: 4.7,
        languages: ['Hindi', 'English'],
        bio: 'Specialized in diabetes management, thyroid disorders, and hormonal imbalances.',
        contact: '+91 9876543227',
        email: 'pooja.verma@example.com',
        imageUrl: 'doctor8.jpeg'
    },
    {
        id: '19',
        name: 'Dr. Sanjay Gupta',
        specialization: 'Urologist',
        qualification: 'MBBS, MS (General Surgery), MCh (Urology)',
        experience: 14,
        fees: 1300,
        availability: 'Mon-Sat, 11AM-7PM',
        location: 'Urology Care Center',
        rating: 4.8,
        languages: ['Hindi', 'English', 'Bengali'],
        bio: 'Expert in urinary system disorders, kidney stones treatment, and urological surgeries.',
        contact: '+91 9876543228',
        email: 'sanjay.gupta@example.com',
        imageUrl: 'doctor2.webp'
    },
    {
        id: '20',
        name: 'Dr. Ananya Iyer',
        specialization: 'Rheumatologist',
        qualification: 'MBBS, MD (Medicine), DM (Rheumatology)',
        experience: 9,
        fees: 950,
        availability: 'Mon-Fri, 10AM-4PM',
        location: 'Arthritis Care Clinic',
        rating: 4.6,
        languages: ['Hindi', 'English', 'Tamil'],
        bio: 'Specialized in arthritis, joint pains, and autoimmune disorders treatment.',
        contact: '+91 9876543229',
        email: 'ananya.iyer@example.com',
        imageUrl: 'doctor3.jpg'
    },
    {
        id: '21',
        name: 'Dr. Rakesh Malhotra',
        specialization: 'Pulmonologist',
        qualification: 'MBBS, MD (Medicine), DM (Pulmonology)',
        experience: 12,
        fees: 900,
        availability: 'Tue-Sat, 9AM-5PM',
        location: 'Lung Care Center',
        rating: 4.7,
        languages: ['Hindi', 'English', 'Punjabi'],
        bio: 'Expert in respiratory diseases, asthma, COPD, and sleep disorders.',
        contact: '+91 9876543230',
        email: 'rakesh.malhotra@example.com',
        imageUrl: 'doctor4.jpg'
    },
    {
        id: '22',
        name: 'Dr. Shalini Das',
        specialization: 'Nephrologist',
        qualification: 'MBBS, MD (Medicine), DM (Nephrology)',
        experience: 11,
        fees: 1200,
        availability: 'Mon-Fri, 10AM-6PM',
        location: 'Kidney Care Hospital',
        rating: 4.8,
        languages: ['Hindi', 'English', 'Odia'],
        bio: 'Specialized in kidney diseases, dialysis management, and kidney transplant care.',
        contact: '+91 9876543231',
        email: 'shalini.das@example.com',
        imageUrl: 'doctor5.jpeg'
    },
    {
        id: '23',
        name: 'Dr. Vikas Singh',
        specialization: 'Gastroenterologist',
        qualification: 'MBBS, MD (Medicine), DM (Gastroenterology)',
        experience: 13,
        fees: 1100,
        availability: 'Mon-Sat, 11AM-7PM',
        location: 'Digestive Health Center',
        rating: 4.9,
        languages: ['Hindi', 'English'],
        bio: 'Expert in digestive system disorders, liver diseases, and endoscopic procedures.',
        contact: '+91 9876543232',
        email: 'vikas.singh@example.com',
        imageUrl: 'doctor6.webp'
    },
    {
        id: '24',
        name: 'Dr. Maya Reddy',
        specialization: 'Oncologist',
        qualification: 'MBBS, MD (Medicine), DM (Oncology)',
        experience: 15,
        fees: 1500,
        availability: 'Mon-Fri, 9AM-5PM',
        location: 'Cancer Care Institute',
        rating: 4.9,
        languages: ['Hindi', 'English', 'Telugu'],
        bio: 'Specialized in cancer treatment, chemotherapy, and oncology care.',
        contact: '+91 9876543233',
        email: 'maya.reddy@example.com',
        imageUrl: 'doctor10.avif'
    },
    {
        id: '25',
        name: 'Dr. Arvind Joshi',
        specialization: 'Physiotherapist',
        qualification: 'BPT, MPT (Orthopedics)',
        experience: 8,
        fees: 400,
        availability: 'Mon-Sat, 8AM-6PM',
        location: 'Physical Therapy Center',
        rating: 4.5,
        languages: ['Hindi', 'English', 'Marathi'],
        bio: 'Expert in physiotherapy, rehabilitation, and pain management techniques.',
        contact: '+91 9876543234',
        email: 'arvind.joshi@example.com',
        imageUrl: 'doctor8.jpeg'
    },
    {
        id: '26',
        name: 'Dr. Smita Patil',
        specialization: 'Homeopathy',
        qualification: 'BHMS, MD (Homeopathy)',
        experience: 10,
        fees: 300,
        availability: 'Mon-Fri, 9AM-4PM',
        location: 'Homeopathic Care Center',
        rating: 4.6,
        languages: ['Hindi', 'English', 'Marathi'],
        bio: 'Practicing homeopathic medicine for chronic diseases and holistic healing.',
        contact: '+91 9876543235',
        email: 'smita.patil@example.com',
        imageUrl: 'doctor9.webp'
    }



    
];

// Function to get doctor by ID
window.getDoctorById = (id) => {
    return window.doctorsData.find(doctor => doctor.id === id) || 
           window.doctors?.find(doctor => doctor.id === id);
};

// Function to get all doctors
window.getAllDoctors = () => {
    return window.doctors || window.doctorsData;
};

// Function to search doctors
window.searchDoctors = (searchTerm) => {
    const allDoctors = window.getAllDoctors();
    return allDoctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.qualification?.toLowerCase().includes(searchTerm.toLowerCase())
    );
};

// Function to add a new doctor
window.addNewDoctor = function(doctorData) {
    const newId = (window.doctorsData.length + 1).toString();
    const newDoctor = {
        id: newId,
        ...doctorData,
        rating: 0,
        totalAppointments: 0,
        views: 0,
        createdAt: new Date().toISOString()
    };
    
    window.doctorsData.push(newDoctor);
    
    // Save to localStorage
    localStorage.setItem('doctors_data', JSON.stringify(window.doctorsData));
    
    return newDoctor;
};

// Function to update doctor
window.updateDoctor = function(doctorId, updatedData) {
    const index = window.doctorsData.findIndex(d => d.id === doctorId);
    if (index !== -1) {
        window.doctorsData[index] = {
            ...window.doctorsData[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('doctors_data', JSON.stringify(window.doctorsData));
        
        return window.doctorsData[index];
    }
    return null;
};

// Initialize doctors data
document.addEventListener('DOMContentLoaded', () => {
    console.log('Doctors data loaded:', window.doctorsData.length, 'doctors available');
    
    // Load from localStorage if available
    const savedDoctors = localStorage.getItem('doctors_data');
    if (savedDoctors) {
        try {
            const parsed = JSON.parse(savedDoctors);
            // Merge with existing data, keeping original as fallback
            window.doctorsData = [...parsed, ...window.doctorsData.filter(d => 
                !parsed.find(p => p.id === d.id)
            )];
        } catch (error) {
            console.error('Error loading saved doctors:', error);
        }
    }
});