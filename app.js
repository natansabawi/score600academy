let tg = window.Telegram.WebApp;
tg.expand();

const studyData = {
    9: [
        { name: "Mathematics / ሂሳብ", url: "#" },
        { name: "Physics / ፊዚክስ", url: "#" },
        { name: "Chemistry / ኬሚስትሪ", url: "#" },
        { name: "Biology / ባዮሎጂ", url: "#" },
        { name: "English / እንግሊዝኛ", url: "#" },
        { name: "Geography / ጂኦግራፊ", url: "#" },
        { name: "History / ታሪክ", url: "#" },
        { name: "Civics / ሲቪክስ", url: "#" },
        { name: "Information Technology (IT) / ព័ቴክ", url: "#" }
    ],
    10: [
        { name: "Mathematics / ሂሳብ", url: "#" },
        { name: "Physics / ፊዚክስ", url: "#" },
        { name: "Chemistry / ኬሚስትሪ", url: "#" },
        { name: "Biology / ባዮሎጂ", url: "#" },
        { name: "English / እንግሊዝኛ", url: "#" },
        { name: "Geography / ጂኦግራፊ", url: "#" },
        { name: "History / ታሪክ", url: "#" },
        { name: "Civics / ሲቪክስ", url: "#" },
        { name: "Information Technology (IT) / ព័ቴክ", url: "#" }
    ],
    11: [
        { name: "General Mathematics / አጠቃላይ ሂሳብ", url: "#" },
        { name: "Advanced Mathematics (Natural) / የቴርሞ ሂሳብ", url: "#" },
        { name: "Physics / ፊዚክስ (Natural)", url: "#" },
        { name: "Chemistry / ኬሚስትሪ (Natural)", url: "#" },
        { name: "Biology / ባዮሎጂ (Natural)", url: "#" },
        { name: "Economics / ኢኮኖሚክስ (Social)", url: "#" },
        { name: "Geography / ጂኦግራፊ (Social)", url: "#" },
        { name: "History / ታሪክ (Social)", url: "#" },
        { name: "English / እንግሊዝኛ", url: "#" }
    ],
    12: [
        { name: "General Mathematics / አጠቃላይ ሂሳብ", url: "#" },
        { name: "Advanced Mathematics (Natural) / የቴርሞ ሂሳብ", url: "#" },
        { name: "Physics / ፊዚክስ (Natural)", url: "#" },
        { name: "Chemistry / ኬሚስትሪ (Natural)", url: "#" },
        { name: "Biology / ባዮሎጂ (Natural)", url: "#" },
        { name: "Economics / ኢኮኖሚክስ (Social)", url: "#" },
        { name: "Geography / ጂኦግራፊ (Social)", url: "#" },
        { name: "History / ታሪክ (Social)", url: "#" },
        { name: "English / እንግሊዝኛ", url: "#" },
        { name: "University Entrance Exam Review / የዩኒቨርሲቲ መግቢያ ፈተና ማጠቃለያ", url: "#" }
    ]
};

function loadGrade(gradeNum) {
    document.querySelector('.grade-selector').classList.add('hidden');
    const contentArea = document.getElementById('content-area');
    contentArea.classList.remove('hidden');

    document.getElementById('selected-grade-title').innerText = `Grade ${gradeNum} Materials / የ${gradeNum}ኛ ክፍል ማስታወሻዎች`;

    const subjectListDiv = document.getElementById('subject-list');
    subjectListDiv.innerHTML = '';

    const subjects = studyData[gradeNum] || [];

    if(subjects.length === 0) {
        subjectListDiv.innerHTML = '<p style="text-align:center; color:#777;">Coming Soon! / በቅርብ ቀን ይጠብቁ!</p>';
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