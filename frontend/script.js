let allMatches = [];
let currentIndex = 0;
const ITEMS_PER_PAGE = 12;

// Slider UI sync
function updateVal(slider) {
  slider.nextElementSibling.innerText = slider.value;
}

// Checkbox selection logic
function toggleGroup(groupName, masterCheckbox) {
  const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
  checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
}

function handleItemChange(groupName) {
  const checkboxes = Array.from(document.querySelectorAll(`input[name="${groupName}"]`));
  const allChecked = checkboxes.every(cb => cb.checked);
  document.getElementById(`${groupName}-all`).checked = allChecked;
}

function getSelectedValues(groupName) {
  const masterCheckbox = document.getElementById(`${groupName}-all`);
  
  if (masterCheckbox && masterCheckbox.checked) {
    return [];
  }

  return Array.from(document.querySelectorAll(`input[name="${groupName}"]:checked`))
              .map(cb => cb.value);
}

// Age formatting helper
function formatAgeInMonths(monthsVal) {
  const months = parseFloat(monthsVal);
  if (isNaN(months) || months < 0) return '';

  if (months < 1) {
    const weeks = Math.round(months * 4.345);
    return `${weeks} wk${weeks !== 1 ? 's' : ''}`;
  }

  const yrs = Math.floor(months / 12);
  const mos = Math.round(months % 12);

  if (yrs === 0) return `${mos} mo${mos !== 1 ? 's' : ''}`;
  if (mos === 0) return `${yrs} yr${yrs !== 1 ? 's' : ''}`;
  return `${yrs} yr${yrs !== 1 ? 's' : ''} ${mos} mo${mos !== 1 ? 's' : ''}`;
}

// API match fetching
async function getMatches() {
  const traitVector = [
    parseInt(document.getElementById('t1').value),
    parseInt(document.getElementById('t2').value),
    parseInt(document.getElementById('t3').value),
    parseInt(document.getElementById('t4').value),
    parseInt(document.getElementById('t5').value),
    parseInt(document.getElementById('t6').value),
    parseInt(document.getElementById('t7').value),
    parseInt(document.getElementById('t8').value),
    parseInt(document.getElementById('t9').value)
  ];

  const payload = {
    size_category: getSelectedValues('size'),
    age_category: getSelectedValues('age'),
    sex_category: getSelectedValues('sex'),
    traits: traitVector,
    top_n: 100 
  };

  try {
    const response = await fetch('http://127.0.0.1:8000/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const container = document.getElementById('results');
    const loadMoreBtn = document.getElementById('load-more-container');
    
    container.innerHTML = '';
    allMatches = data.results || [];
    currentIndex = 0;

    if (allMatches.length === 0) {
      container.innerHTML = `<p style="grid-column: span 3; text-align:center; font-size:1.1rem; color:var(--text-muted);">No dogs matched your filters. Try selecting more options or "Any".</p>`;
      loadMoreBtn.style.display = 'none';
      return;
    }

    renderNextBatch();

  } catch (err) {
    console.error(err);
    alert('Could not connect to recommendation server. Ensure your backend is running.');
  }
}

// Card rendering logic
function renderNextBatch() {
  const container = document.getElementById('results');
  const loadMoreBtnContainer = document.getElementById('load-more-container');

  const nextBatch = allMatches.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);

  nextBatch.forEach(dog => {
    const rawMonths = dog.Age_Months ?? dog.age_months;
    const formattedAge = formatAgeInMonths(rawMonths);
    const ageDisplay = formattedAge ? `${dog.age_category} (${formattedAge})` : dog.age_category;
    const sexDisplay = dog['Sex upon Outcome'] || dog.Sex || dog.sex || '';

    // Direct link to main live adoption portal
    const shelterUrl = 'https://adopt.adopets.com/shelter/austin-animal-center?page=1';

    container.innerHTML += `
      <div class="card">
        <div class="card-body">
          <h2 class="dog-name">${dog.Name}</h2>
          <div class="dog-breed">${dog.Breed}</div>
          <p class="dog-info">
            <strong>Age:</strong> ${ageDisplay} | 
            <strong>Size:</strong> ${dog.size_category}
            ${sexDisplay ? `| <strong>Sex:</strong> ${sexDisplay}` : ''}
          </p>
          <div class="score">Match Score: ${dog.match_score}%</div>
          <p class="temperament">"${dog.temperament}"</p>
          <a href="${shelterUrl}" target="_blank" rel="noopener noreferrer" class="btn-contact" style="display:block; text-align:center; text-decoration:none;">
            Browse Shelter Portal
          </a>
        </div>
      </div>
    `;
  });

  currentIndex += ITEMS_PER_PAGE;

  if (currentIndex >= allMatches.length) {
    loadMoreBtnContainer.style.display = 'none';
  } else {
    loadMoreBtnContainer.style.display = 'block';
  }
}