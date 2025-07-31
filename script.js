document.addEventListener('DOMContentLoaded', () => {
    const employeeList = document.getElementById('employee-list');
    const dayOffSettings = document.getElementById('day-off-settings');
    const generateRosterBtn = document.getElementById('generate-roster-btn');
    const rosterResults = document.getElementById('roster-results');
    const confettiContainer = document.getElementById('confetti-container');
    const dutyCountList = document.getElementById('duty-count-list');

    let dutyCounts = {};
    let daysOff = {};
    const days = ['월', '화', '수', '목', '금', '토'];

    // Define raw employee data
    const rawEmployeeData = [
  {
    "name": "준식",
    "category": "main",
    "detail": "데스크"
  },
  {
    "name": "은서",
    "category": "main",
    "detail": "데스크"
  },
  {
    "name": "현우",
    "category": "main",
    "detail": "데스크"
  },
  {
    "name": "나혜",
    "category": "main",
    "detail": "실장"
  },
  {
    "name": "다나",
    "category": "main",
    "detail": "실장"
  },
  {
    "name": "지현",
    "category": "main",
    "detail": "실장"
  },
  {
    "name": "수연",
    "category": "sub",
    "detail": "실장"
  },
  {
    "name": "지우",
    "category": "sub",
    "detail": "실장"
  },
  {
    "name": "지은",
    "category": "sub",
    "detail": "실장"
  },
  {
    "name": "소연",
    "category": "sub",
    "detail": "데스크"
  },
  {
    "name": "사치카",
    "category": "sub",
    "detail": "데스크"
  },
  {
    "name": "도경",
    "category": "sub",
    "detail": "데스크"
  }
];

    // Process raw data into the 'employees' array
    employees = rawEmployeeData.map(emp => ({
        name: emp.name,
        category: emp.category,
        isMain: emp.category === 'main'
    }));

    // Initialize dutyCounts for all employees
    employees.forEach(emp => dutyCounts[emp.name] = 0);

    // Initial rendering and setup
    renderEmployees();
    setupDayOffDropZones();
    adjustWidgetHeights();

    // 1. 직원 관리
    function renderEmployees() {
        console.log('Rendering employees. Current employees:', employees);
        employeeList.innerHTML = '';
        employees.forEach((emp) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.dataset.name = emp.name;
            li.innerHTML = `
                <span>
                    ${emp.name}
                    ${emp.isMain ? '<span class="main-star">★</span>' : ''}
                </span>
            `;
            employeeList.appendChild(li);
        });
        renderDayOffTags();
        renderDutyCounts();
        setTimeout(adjustWidgetHeights, 0);
    }

    // 당번 횟수 렌더링
    function renderDutyCounts() {
        dutyCountList.innerHTML = '';
        const sortedCounts = Object.entries(dutyCounts).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [name, count] of sortedCounts) {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${name}</span>
                <span class="duty-count">${count}회</span>
            `;
            dutyCountList.appendChild(li);
        }
    }

    // 2. 휴무 설정 (드래그 앤 드롭)
    function setupDayOffDropZones() {
        dayOffSettings.innerHTML = '';
        days.forEach(day => {
            const row = document.createElement('div');
            row.className = 'day-off-row';
            row.dataset.day = day;
            row.innerHTML = `
                <div class="day-label">${day}요일</div>
                <div class="employee-tags" id="tags-${day}"></div>
            `;
            dayOffSettings.appendChild(row);
        });
        renderDayOffTags();
    }

    function renderDayOffTags() {
        days.forEach(day => {
            const container = document.getElementById(`tags-${day}`);
            if (!container) return;
            container.innerHTML = '';
            if (daysOff[day]) {
                daysOff[day].forEach(name => {
                    const tag = document.createElement('div');
                    tag.className = 'employee-tag selected';
                    tag.textContent = name;
                    tag.dataset.name = name;
                    tag.dataset.day = day;
                    container.appendChild(tag);
                });
            }
        });
    }

    employeeList.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'LI') {
            e.dataTransfer.setData('text/plain', e.target.dataset.name);
            e.target.style.opacity = '0.5';
        }
    });

    employeeList.addEventListener('dragend', (e) => {
        if (e.target.tagName === 'LI') {
            e.target.style.opacity = '1';
        }
    });

    dayOffSettings.addEventListener('dragover', (e) => {
        e.preventDefault();
        const targetDay = e.target.closest('.day-off-row');
        if (targetDay) {
            targetDay.classList.add('drag-over');
        }
    });

    dayOffSettings.addEventListener('dragleave', (e) => {
        const targetDay = e.target.closest('.day-off-row');
        if (targetDay) {
            targetDay.classList.remove('drag-over');
        }
    });

    dayOffSettings.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetDayRow = e.target.closest('.day-off-row');
        if (targetDayRow) {
            targetDayRow.classList.remove('drag-over');
            const employeeName = e.dataTransfer.getData('text/plain');
            const day = targetDayRow.dataset.day;

            if (!daysOff[day]) {
                daysOff[day] = [];
            }
            if (!daysOff[day].includes(employeeName)) {
                daysOff[day].push(employeeName);
                renderDayOffTags();
            }
        }
    });

    dayOffSettings.addEventListener('click', (e) => {
        if (e.target.classList.contains('employee-tag')) {
            const { name, day } = e.target.dataset;
            const index = daysOff[day].indexOf(name);
            if (index > -1) {
                daysOff[day].splice(index, 1);
                renderDayOffTags();
            }
        }
    });

    // 3. 당번 정하기 (SIMULATION-BASED FINAL ALGORITHM)
    function createSingleRosterCandidate(tempDutyCounts) {
        const weeklyRoster = {};
        const assignedThisWeek = new Set();

        const fairnessSort = (a, b) => {
            const aAssigned = assignedThisWeek.has(a.name);
            const bAssigned = assignedThisWeek.has(b.name);
            if (aAssigned !== bAssigned) return aAssigned ? 1 : -1;

            const countA = tempDutyCounts[a.name] || 0;
            const countB = tempDutyCounts[b.name] || 0;
            if (countA !== countB) return countA - countB;
            
            // category를 고려하여 정렬 (main 우선, 그 다음 sub)
            if (a.category === 'main' && b.category === 'sub') return -1;
            if (a.category === 'sub' && b.category === 'main') return 1;

            return Math.random() - 0.5; // 동점일 경우 무작위
        };

        for (const day of days) {
            const available = employees.filter(emp => !daysOff[day]?.includes(emp.name));
            let assignedForDay = [];

            let mainPool = available.filter(emp => emp.category === 'main').sort(fairnessSort);
            let subPool = available.filter(emp => emp.category === 'sub').sort(fairnessSort);
            
            let mainAssigned = null;
            let subAssigned = null;

            // 1. 메인 1명, 서브 1명 우선 배정
            if (mainPool.length > 0) {
                mainAssigned = mainPool.shift();
                assignedForDay.push(mainAssigned);
            }
            if (subPool.length > 0) {
                subAssigned = subPool.shift();
                assignedForDay.push(subAssigned);
            }

            // 2. 아직 2명이 채워지지 않았다면, 남은 인원 중에서 추가 배정
            if (assignedForDay.length < 2) {
                const remainingAvailable = available.filter(emp => 
                    (mainAssigned ? emp.name !== mainAssigned.name : true) &&
                    (subAssigned ? emp.name !== subAssigned.name : true)
                ).sort(fairnessSort);

                while (assignedForDay.length < 2 && remainingAvailable.length > 0) {
                    assignedForDay.push(remainingAvailable.shift());
                }
            }

            assignedForDay.forEach(emp => {
                assignedThisWeek.add(emp.name);
                tempDutyCounts[emp.name]++; // 시뮬레이션용 카운트 업데이트
            });
            weeklyRoster[day] = assignedForDay;
        }
        return weeklyRoster;
    }

    function calculateRosterScore(roster) {
        let score = 0;
        const weeklyCounts = {};
        employees.forEach(emp => weeklyCounts[emp.name] = 0);

        for (const day in roster) {
            const assigned = roster[day];
            
            // 1. 배정 인원이 2명이 아니면 큰 페널티
            if (assigned.length !== 2) {
                score += 1000; 
            } else {
                const mainCount = assigned.filter(emp => emp.category === 'main').length;
                const subCount = assigned.filter(emp => emp.category === 'sub').length;

                // 2. 메인 1명, 서브 1명이 아니면 페널티
                if (mainCount !== 1 || subCount !== 1) {
                    score += 100;
                }
            }
            assigned.forEach(emp => weeklyCounts[emp.name]++);
        }

        // 3. 당번 횟수의 균일성 (표준 편차)
        const counts = Object.values(weeklyCounts);
        if (counts.length > 0) {
            const mean = counts.reduce((a, b) => a + b) / counts.length;
            const stdDev = Math.sqrt(counts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / counts.length);
            score += stdDev * 20; // 표준 편차가 낮을수록 좋은 점수
        }
        return score;
    }

    function generateRoster() {
        rosterResults.innerHTML = '';
        if (employees.length < 2) {
            rosterResults.innerHTML = '<p>직원을 2명 이상 등록해주세요.</p>';
            return;
        }

        // 1. 당번 횟수 초기화
        Object.keys(dutyCounts).forEach(name => dutyCounts[name] = 0);

        let bestRoster = null;
        let bestScore = Infinity;

        // 2. 10회 시뮬레이션으로 최적의 결과 탐색
        for (let i = 0; i < 10; i++) {
            // 매 시뮬레이션마다 초기화된 카운트 복사본 사용
            const tempDutyCounts = { ...dutyCounts }; 
            const candidateRoster = createSingleRosterCandidate(tempDutyCounts);
            const score = calculateRosterScore(candidateRoster);

            if (score < bestScore) {
                bestScore = score;
                bestRoster = candidateRoster;
            }
        }

        // 3. 최종 결과 렌더링 및 실제 카운트 업데이트
        let allDaysFull = true;
        for (const day of days) {
            const assignedForDay = bestRoster[day] || [];
            if (assignedForDay.length < 2) allDaysFull = false;

            assignedForDay.forEach(emp => {
                dutyCounts[emp.name] = (dutyCounts[emp.name] || 0) + 1;
            });

            const dayDiv = document.createElement('div');
            dayDiv.className = 'roster-day';
            const list = document.createElement('ul');
            dayDiv.innerHTML = `<h3>${day}요일</h3>`;

            if (assignedForDay.length > 0) {
                assignedForDay.forEach(emp => {
                    const li = document.createElement('li');
                    li.innerHTML = `${emp.name} ${emp.isMain ? '<span class="main-star">★</span>' : ''}`;
                    list.appendChild(li);
                });
            }
            if (list.children.length === 0) {
                const li = document.createElement('li');
                li.textContent = '배정 인원 없음';
                li.style.color = 'var(--light-text-color)';
                list.appendChild(li);
            } else if (list.children.length < 2) {
                const li = document.createElement('li');
                li.textContent = '추가 인원 부족';
                li.style.color = 'var(--light-text-color)';
                list.appendChild(li);
            }
            dayDiv.appendChild(list);
            rosterResults.appendChild(dayDiv);
        }

        if (allDaysFull) {
            triggerConfetti();
        }
        renderDutyCounts();
    }

    generateRosterBtn.addEventListener('click', generateRoster);

    // 4. 동적 높이 조절
    function adjustWidgetHeights() {
        const dayOffHeight = dayOffSettings.offsetHeight;
        dutyCountList.style.height = `${dayOffHeight}px`;
    }

    // 5. 경사스러운 효과 (Confetti)
    function triggerConfetti() {
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confettiContainer.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }
    }

    // 초기화
    renderEmployees(); // Add this line to render employees on load
    setupDayOffDropZones();
    adjustWidgetHeights();
    window.addEventListener('resize', adjustWidgetHeights);
});