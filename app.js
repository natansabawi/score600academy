let tg = window.Telegram.WebApp;
tg.expand();

const studyData = {
    9: [
        { name: "Mathematics / ???", url: "#" },
        { name: "Physics / ????", url: "#" },
        { name: "Chemistry / ?????", url: "#" },
        { name: "Biology / ????", url: "#" },
        { name: "English / ??????", url: "#" },
        { name: "Geography / ?????", url: "#" },
        { name: "History / ???", url: "#" },
        { name: "Civics / ????", url: "#" },
        { name: "Information Technology (IT) / ????", url: "#" }
    ],
    10: [
        { name: "Mathematics / ???", url: "#" },
        { name: "Physics / ????", url: "#" },
        { name: "Chemistry / ?????", url: "#" },
        { name: "Biology / ????", url: "#" },
        { name: "English / ??????", url: "#" },
        { name: "Geography / ?????", url: "#" },
        { name: "History / ???", url: "#" },
        { name: "Civics / ????", url: "#" },
        { name: "Information Technology (IT) / ????", url: "#" }
    ],
    11: [
        { name: "General Mathematics / ????? ???", url: "#" },
        { name: "Advanced Mathematics (Natural) / ???? ???", url: "#" },
        { name: "Physics / ???? (Natural)", url: "#" },
        { name: "Chemistry / ????? (Natural)", url: "#" },
        { name: "Biology / ???? (Natural)", url: "#" },
        { name: "Economics / ?????? (Social)", url: "#" },
        { name: "Geography / ????? (Social)", url: "#" },
        { name: "History / ??? (Social)", url: "#" },
        { name: "English / ??????", url: "#" }
    ],
    12: [
        { name: "General Mathematics / ????? ???", url: "#" },
        { name: "Advanced Mathematics (Natural) / ???? ???", url: "#" },
        { name: "Physics / ???? (Natural)", url: "#" },
        { name: "Chemistry / ????? (Natural)", url: "#" },
        { name: "Biology / ???? (Natural)", url: "#" },
        { name: "Economics / ?????? (Social)", url: "#" },
        { name: "Geography / ????? (Social)", url: "#" },
        { name: "History / ??? (Social)", url: "#" },
        { name: "English / ??????", url: "#" },
        { name: "University Entrance Exam Review / ??????? ???? ??? ?????", url: "#" }
    ]
};

function loadGrade(gradeNum) {
    document.querySelector('.grade-selector').classList.add('hidden');
    const contentArea = document.getElementById('content-area');
    contentArea.classList.remove('hidden');

    document.getElementById('selected-grade-title').innerText = \Grade \ Materials / ?\? ??? ???????\;
    
    const subjectListDiv = document.getElementById('subject-list');
    subjectListDiv.innerHTML = '';

    const subjects = studyData[gradeNum] || [];
    
    if(subjects.length === 0) {
        subjectListDiv.innerHTML = '<p style="text-align:center; color:#777;">Coming Soon! / ???? ?? ????!</p>';
        return;
    }

    subjects.forEach(sub => {
        let link = document.createElement('a');
        link.href = sub.url;
        link.target = '_blank';
        link.innerText = sub.name;
        subjectListDiv.appendChild(link);
    });
}

function goBack() {
    document.getElementById('content-area').classList.add('hidden');
    document.querySelector('.grade-selector').classList.remove('hidden');
}
