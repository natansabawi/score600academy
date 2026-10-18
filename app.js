let tg = window.Telegram.WebApp;
tg.expand();

let user = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
let userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : "Telegram Student";
let userUsername = user && user.username ? `@${user.username}` : "No Username";

const studyData = {
    9: [
        { name: "Mathematics / ሂሳብ", url: "#" },
        { name: "Physics / ፊዚክስ", url: "#" },
        { name: "Chemistry / ኬሚስትሪ", url: "#" },
        { name: "Biology / ባዮሎጂ", url: "#" },
        { name: "Economics / ኢኮኖሚክስ", url: "#" },
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
        { name: "Economics / ኢኮኖሚክስ", url: "#" },
        { name: "English / እንግሊዝኛ", url: "#" },
        { name: "Geography / ጂኦግራፊ", url: "#" },
        { name: "History / ታሪክ", url: "#" },
        { name: "Civics / ሲቪክስ", url: "#" },
        { name: "Information Technology (IT) / ព័ቴክ", url: "#" }
    ],
    11: [
        { name: "General Mathematics / አጠቃላይ ሂሳብ", url: "#" },
        { name: "Advanced Mathematics / የቴርሞ ሂሳብ", url: "#" },
        { name: "Physics / ፊዚክስ", url: "#" },
        { name: "Chemistry / ኬሚስትሪ", url: "#" },
        { name: "Biology / ባዮሎጂ", url: "#" },
        { name: "Economics / ኢኮኖሚክስ", url: "#" },
        { name: "Geography / ጂኦግራፊ", url: "#" },
        { name: "History / ታሪክ", url: "#" },
        { name: "English / እንግሊዝኛ", url: "#" }
    ],
    12: [
        { name: "General Mathematics / አጠቃላይ ሂሳብ", url: "#" },
        { name: "Advanced Mathematics / የቴርሞ ሂሳብ", url: "#" },
        { name: "Physics / ፊዚክስ", url: "#" },
        { name: "Chemistry / ኬሚስትሪ", url: "#" },
        { name: "Biology / ባዮሎጂ", url: "#" },
        { name: "Economics / ኢኮኖሚክስ", url: "#" },
        { name: "Geography / ጂኦግራፊ", url: "#" },
        { name: "History / ታሪክ", url: "#" },
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

        link.addEventListener('click', function(e) {
            console.log(`Student ${userName} downloaded: ${sub.name}`);
        });

        subjectListDiv.appendChild(link);
    });
}

function goBack() {
    document.getElementById('content-area').classList.add('hidden');
    document.querySelector('.grade-selector').classList.remove('hidden');
}