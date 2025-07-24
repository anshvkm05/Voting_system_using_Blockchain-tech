const translations = {
    en: {
        admin_login: "Admin Login",
        voter_login: "Voter Login",
        admin_access: "Admin Access",
        voter_access: "Voter Access",
        username: "Username",
        password: "Password",
        voter_id: "Voter ID",
        biometric_auth: "Biometric Authentication",
        login: "Login",
        admin_panel: "Admin Panel",
        dashboard: "Dashboard",
        manage_parties: "Manage Parties",
        manage_users: "Manage Users",
        analytics: "Analytics",
        logout: "Logout",
        total_voters: "Total Voters",
        votes_cast: "Votes Cast",
        turnout_rate: "Turnout Rate",
        active_parties: "Active Parties",
        add_party: "Add Party",
        add_user: "Add User",
        add_new_party: "Add New Party",
        add_new_user: "Add New User",
        party_name: "Party Name",
        candidate_name: "Candidate Name",
        party_description: "Party Description",
        logo_url: "Logo URL",
        full_name: "Full Name",
        email: "Email",
        phone_number: "Phone Number",
        cancel: "Cancel",
        voting_portal: "Voting Portal",
        read_aloud: "Read Aloud",
        vote_confirmed: "Your vote has been successfully recorded!",
        select_candidate: "Please select your preferred candidate below:",
        confirm_vote: "Confirm Your Vote",
        confirm_message: "Are you sure you want to vote for:",
        confirm_vote_btn: "Confirm Vote",
        regional_breakdown: "Regional Breakdown",
        voting_timeline: "Voting Timeline",
        vote: "Vote",
        edit: "Edit",
        delete: "Delete",
        activate: "Activate",
        deactivate: "Deactivate",
        voted: "Voted",
        not_voted: "Not Voted",
        active: "Active",
        inactive: "Inactive",
        biometric_verification: "Biometric Verification",
        verify_identity: "Please verify your identity to cast your vote",
        facial_recognition: "Facial Recognition",
        fingerprint_scan: "Fingerprint Scan",
        proceed_to_vote: "Proceed to Vote"
    },
    hi: {
        admin_login: "व्यवस्थापक लॉगिन",
        voter_login: "मतदाता लॉगिन",
        admin_access: "व्यवस्थापक पहुंच",
        voter_access: "मतदाता पहुंच",
        username: "उपयोगकर्ता नाम",
        password: "पासवर्ड",
        voter_id: "मतदाता पहचान",
        biometric_auth: "बायोमेट्रिक प्रमाणीकरण",
        login: "लॉगिन",
        admin_panel: "व्यवस्थापक पैनल",
        dashboard: "डैशबोर्ड",
        manage_parties: "पार्टियों का प्रबंधन",
        manage_users: "उपयोगकर्ताओं का प्रबंधन",
        analytics: "विश्लेषण",
        logout: "लॉगआउट",
        total_voters: "कुल मतदाता",
        votes_cast: "डाले गए वोट",
        turnout_rate: "मतदान प्रतिशत",
        active_parties: "सक्रिय पार्टियां",
        add_party: "पार्टी जोड़ें",
        add_user: "उपयोगकर्ता जोड़ें",
        add_new_party: "नई पार्टी जोड़ें",
        add_new_user: "नया उपयोगकर्ता जोड़ें",
        party_name: "पार्टी का नाम",
        candidate_name: "उम्मीदवार का नाम",
        party_description: "पार्टी विवरण",
        logo_url: "लोगो URL",
        full_name: "पूरा नाम",
        email: "ईमेल",
        phone_number: "फोन नंबर",
        cancel: "रद्द करें",
        voting_portal: "मतदान पोर्टल",
        read_aloud: "जोर से पढ़ें",
        vote_confirmed: "आपका वोट सफलतापूर्वक दर्ज हो गया है!",
        select_candidate: "कृपया नीचे अपना पसंदीदा उम्मीदवार चुनें:",
        confirm_vote: "अपना वोट पुष्ट करें",
        confirm_message: "क्या आप वाकई वोट देना चाहते हैं:",
        confirm_vote_btn: "वोट पुष्ट करें",
        regional_breakdown: "क्षेत्रीय विभाजन",
        voting_timeline: "मतदान समयरेखा",
        vote: "वोट",
        edit: "संपादित करें",
        delete: "हटाएं",
        activate: "सक्रिय करें",
        deactivate: "निष्क्रिय करें",
        voted: "वोट किया",
        not_voted: "वोट नहीं किया",
        active: "सक्रिय",
        inactive: "निष्क्रिय",
        biometric_verification: "बायोमेट्रिक सत्यापन",
        verify_identity: "कृपया अपना वोट डालने के लिए अपनी पहचान सत्यापित करें",
        facial_recognition: "चेहरा पहचान",
        fingerprint_scan: "फिंगरप्रिंट स्कैन",
        proceed_to_vote: "वोट देने के लिए आगे बढ़ें"
    }
};

let currentLanguage = 'en';

function changeLanguage(lang) {
    currentLanguage = lang;
    
    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
    
    // Update all translatable elements
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholder attributes
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Update read-aloud functionality
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

function getCurrentTranslation(key) {
    return translations[currentLanguage] && translations[currentLanguage][key] ? 
           translations[currentLanguage][key] : key;
}