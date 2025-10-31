// 전역 변수
let currentUser = null;
let currentVeganType = null;
let currentPage = 1;
let currentFilters = {};
let testAnswers = [];
let currentQuestionIndex = 0;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadRecipes();
    setupEventListeners();
});

// 앱 초기화
function initializeApp() {
    // 사용자 로그인 상태 확인
    checkUserLogin();
    
    // 스무스 스크롤 설정
    setupSmoothScroll();
    
    // 초기 데이터 로드
    loadVeganTypes();
}

// 스무스 스크롤 설정
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 섹션으로 스크롤
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 네비게이션 클릭 이벤트
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // 활성 상태 업데이트
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 스크롤 시 네비게이션 하이라이트
    window.addEventListener('scroll', updateNavigationHighlight);
}

// 네비게이션 하이라이트 업데이트
function updateNavigationHighlight() {
    const sections = ['home', 'vegan-test', 'recipes', 'meal-plan', 'chatbot'];
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        const navLink = document.querySelector(`a[href="#${sectionId}"]`);
        
        if (section && navLink) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                navLink.classList.add('active');
            }
        }
    });
}

// 사용자 로그인 상태 확인
function checkUserLogin() {
    const savedUser = localStorage.getItem('slunchUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserInterface();
    }
}

// 사용자 인터페이스 업데이트
function updateUserInterface() {
    if (currentUser) {
        const loginBtn = document.querySelector('.navbar .btn-outline-light');
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user me-1"></i>${currentUser.name}`;
            loginBtn.onclick = showUserMenu;
        }
    }
}

// 로그인 모달 표시
function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

// 로그인 처리
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAlert('이메일과 비밀번호를 입력해주세요.', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.data.user;
            localStorage.setItem('slunchUser', JSON.stringify(currentUser));
            
            // 모달 닫기
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide();
            
            updateUserInterface();
            showAlert('로그인되었습니다!', 'success');
        } else {
            showAlert(data.message || '로그인에 실패했습니다.', 'danger');
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        showAlert('로그인 중 오류가 발생했습니다.', 'danger');
    }
}

// 사용자 메뉴 표시
function showUserMenu() {
    // 사용자 메뉴 구현
    console.log('사용자 메뉴 표시');
}

// 비건 타입 테스트 시작
function startVeganTest() {
    document.getElementById('test-intro').classList.add('d-none');
    document.getElementById('test-questions').classList.remove('d-none');
    
    currentQuestionIndex = 0;
    testAnswers = [];
    loadQuestion();
}

// 질문 로드
function loadQuestion() {
    const questions = getVeganTestQuestions();
    
    if (currentQuestionIndex >= questions.length) {
        showTestResult();
        return;
    }
    
    const question = questions[currentQuestionIndex];
    const container = document.getElementById('question-container');
    
    container.innerHTML = `
        <div class="test-question">
            <h3 class="question-title">${question.question}</h3>
            <div class="question-options">
                ${question.options.map((option, index) => `
                    <button class="option-button" onclick="selectAnswer(${index})">
                        <strong>${option.label}</strong>
                        <div class="text-muted">${option.description}</div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    updateProgress();
}

// 답변 선택
function selectAnswer(optionIndex) {
    const question = getVeganTestQuestions()[currentQuestionIndex];
    const answer = question.options[optionIndex];
    
    testAnswers.push({
        questionIndex: currentQuestionIndex,
        answer: answer,
        score: answer.score
    });
    
    currentQuestionIndex++;
    
    // 선택된 버튼 하이라이트
    document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
    event.target.closest('.option-button').classList.add('selected');
    
    // 다음 질문으로 이동 (약간의 지연)
    setTimeout(() => {
        loadQuestion();
    }, 500);
}

// 진행률 업데이트
function updateProgress() {
    const questions = getVeganTestQuestions();
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    document.getElementById('test-progress').style.width = `${progress}%`;
}

// 테스트 결과 표시
async function showTestResult() {
    document.getElementById('test-questions').classList.add('d-none');
    document.getElementById('test-result').classList.remove('d-none');
    
    // AI를 통한 비건 타입 분석
    const userData = buildUserProfileFromAnswers();
    const result = await analyzeVeganType(userData);
    
    currentVeganType = result.predictedType;
    
    document.getElementById('result-title').textContent = result.veganTypeInfo.name;
    document.getElementById('result-description').textContent = result.veganTypeInfo.description;
    
    // 결과 세부사항 표시
    const detailsContainer = document.getElementById('result-details');
    detailsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h5>특징</h5>
                <ul class="list-unstyled">
                    <li><strong>식이 선호도:</strong> ${result.veganTypeInfo.characteristics.dietaryPreference}</li>
                    <li><strong>요리 스타일:</strong> ${result.veganTypeInfo.characteristics.cookingStyle}</li>
                    <li><strong>주요 맛:</strong> ${result.veganTypeInfo.characteristics.flavorProfile.primary}</li>
                </ul>
            </div>
            <div class="col-md-6">
                <h5>성격</h5>
                <ul class="list-unstyled">
                    <li><strong>접근 방식:</strong> ${result.veganTypeInfo.personality.approach}</li>
                    <li><strong>라이프스타일:</strong> ${result.veganTypeInfo.personality.lifestyle}</li>
                    <li><strong>동기:</strong> ${result.veganTypeInfo.personality.motivation.join(', ')}</li>
                </ul>
            </div>
        </div>
        <div class="mt-3">
            <div class="alert alert-info">
                <strong>신뢰도:</strong> ${(result.confidence * 100).toFixed(1)}%
            </div>
        </div>
    `;
    
    updateProgress();
}

// 사용자 프로필 구축
function buildUserProfileFromAnswers() {
    return {
        age: 30,
        gender: 'other',
        dietaryPreferences: {
            restrictions: []
        },
        healthGoals: [],
        activityLevel: 'moderate',
        mealPreferences: {},
        preferences: {}
    };
}

// 비건 타입 분석
async function analyzeVeganType(userData) {
    try {
        const response = await fetch('/api/chatbot/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: '비건 타입 테스트',
                userId: currentUser?.id
            })
        });
        
        const data = await response.json();
        return data.response.data;
    } catch (error) {
        console.error('비건 타입 분석 오류:', error);
        // 기본 결과 반환
        return {
            predictedType: 'VEGAN-ISTJ',
            confidence: 0.8,
            veganTypeInfo: {
                name: '체계적 완전비건',
                description: '체계적이고 전통적인 완전비건을 추구하는 타입입니다.',
                characteristics: {
                    dietaryPreference: '완전비건',
                    cookingStyle: '전통식',
                    flavorProfile: { primary: '감칠맛' }
                },
                personality: {
                    approach: '체계적',
                    lifestyle: '홈쿡러',
                    motivation: ['건강', '동물보호']
                }
            }
        };
    }
}

// 레시피 로드
async function loadRecipes(page = 1) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 12,
            ...currentFilters
        });
        
        const response = await fetch(`/api/recipes?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displayRecipes(data.data.recipes);
            currentPage = page;
            
            // 더보기 버튼 상태 업데이트
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = data.data.pagination.current < data.data.pagination.pages ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('레시피 로드 오류:', error);
        showAlert('레시피를 불러오는 중 오류가 발생했습니다.', 'danger');
    }
}

// 레시피 표시
function displayRecipes(recipes) {
    const container = document.getElementById('recipes-grid');
    
    if (currentPage === 1) {
        container.innerHTML = '';
    }
    
    recipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        container.appendChild(recipeCard);
    });
    
    // 애니메이션 적용
    container.querySelectorAll('.recipe-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in-up');
    });
}

// 레시피 카드 생성
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'col-lg-4 col-md-6 mb-4 recipe-card';
    
    card.innerHTML = `
        <div class="card h-100">
            <img src="${recipe.images?.[0]?.url || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                 class="card-img-top" alt="${recipe.title}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title recipe-title">${recipe.title}</h5>
                <p class="card-text recipe-description">${recipe.description}</p>
                
                <div class="recipe-meta mt-auto">
                    <div class="recipe-rating">
                        <div class="stars">
                            ${generateStars(recipe.rating.average)}
                        </div>
                        <span class="ms-1">${recipe.rating.average.toFixed(1)}</span>
                    </div>
                    <div class="recipe-difficulty">
                        <div class="difficulty-stars">
                            ${generateDifficultyStars(recipe.difficulty)}
                        </div>
                        <span class="ms-1">${recipe.difficulty}/5</span>
                    </div>
                </div>
                
                <div class="recipe-tags">
                    ${recipe.categories?.slice(0, 2).map(cat => `<span class="tag">${cat}</span>`).join('') || ''}
                    ${recipe.cuisine ? `<span class="tag primary">${recipe.cuisine}</span>` : ''}
                </div>
                
                <div class="mt-3">
                    <button class="btn btn-success w-100" onclick="viewRecipeDetail('${recipe._id}')">
                        <i class="fas fa-eye me-2"></i>자세히 보기
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// 별점 생성
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// 난이도 별 생성
function generateDifficultyStars(difficulty) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= difficulty) {
            stars += '<i class="fas fa-star filled"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// 레시피 상세 보기
async function viewRecipeDetail(recipeId) {
    try {
        const response = await fetch(`/api/recipes/${recipeId}`);
        const data = await response.json();
        
        if (data.success) {
            showRecipeModal(data.data);
        }
    } catch (error) {
        console.error('레시피 상세 조회 오류:', error);
        showAlert('레시피 정보를 불러오는 중 오류가 발생했습니다.', 'danger');
    }
}

// 레시피 모달 표시
function showRecipeModal(recipe) {
    const modal = document.getElementById('recipeModal');
    const title = document.getElementById('recipe-modal-title');
    const body = document.getElementById('recipe-modal-body');
    
    title.textContent = recipe.title;
    
    body.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${recipe.images?.[0]?.url || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                     class="img-fluid rounded mb-3" alt="${recipe.title}">
                
                <div class="recipe-meta mb-3">
                    <div class="row text-center">
                        <div class="col-3">
                            <div class="text-muted">조리시간</div>
                            <div class="fw-bold">${recipe.prepTime + recipe.cookTime}분</div>
                        </div>
                        <div class="col-3">
                            <div class="text-muted">난이도</div>
                            <div class="fw-bold">${recipe.difficulty}/5</div>
                        </div>
                        <div class="col-3">
                            <div class="text-muted">인분</div>
                            <div class="fw-bold">${recipe.servings}인분</div>
                        </div>
                        <div class="col-3">
                            <div class="text-muted">평점</div>
                            <div class="fw-bold">${recipe.rating.average.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <h6>재료</h6>
                <ul class="list-group list-group-flush mb-3">
                    ${recipe.ingredients.map(ingredient => `
                        <li class="list-group-item d-flex justify-content-between">
                            <span>${ingredient.name}</span>
                            <span class="text-muted">${ingredient.amount} ${ingredient.unit}</span>
                        </li>
                    `).join('')}
                </ul>
                
                <h6>영양 정보</h6>
                <div class="row text-center">
                    <div class="col-3">
                        <div class="text-muted">칼로리</div>
                        <div class="fw-bold">${recipe.nutritionalInfo?.totalCalories || 0}kcal</div>
                    </div>
                    <div class="col-3">
                        <div class="text-muted">단백질</div>
                        <div class="fw-bold">${recipe.nutritionalInfo?.protein || 0}g</div>
                    </div>
                    <div class="col-3">
                        <div class="text-muted">탄수화물</div>
                        <div class="fw-bold">${recipe.nutritionalInfo?.carbs || 0}g</div>
                    </div>
                    <div class="col-3">
                        <div class="text-muted">지방</div>
                        <div class="fw-bold">${recipe.nutritionalInfo?.fat || 0}g</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-4">
            <h6>조리 방법</h6>
            <ol>
                ${recipe.instructions.map(instruction => `
                    <li class="mb-2">${instruction.description}</li>
                `).join('')}
            </ol>
        </div>
        
        <div class="mt-4">
            <h6>태그</h6>
            <div class="recipe-tags">
                ${recipe.categories?.map(cat => `<span class="tag">${cat}</span>`).join('') || ''}
                ${recipe.dietaryTags?.map(tag => `<span class="tag primary">${tag}</span>`).join('') || ''}
            </div>
        </div>
    `;
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// 더 많은 레시피 로드
function loadMoreRecipes() {
    loadRecipes(currentPage + 1);
}

// 필터 적용
function applyFilters() {
    currentFilters = {
        category: document.getElementById('category-filter').value,
        cuisine: document.getElementById('cuisine-filter').value,
        difficulty: document.getElementById('difficulty-filter').value,
        search: document.getElementById('search-input').value
    };
    
    // 빈 값 제거
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) {
            delete currentFilters[key];
        }
    });
    
    currentPage = 1;
    loadRecipes();
}

// 필터 초기화
function clearFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('cuisine-filter').value = '';
    document.getElementById('difficulty-filter').value = '';
    document.getElementById('search-input').value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadRecipes();
}

// 레시피 검색
function searchRecipes() {
    applyFilters();
}

// 1주일 식단 생성
async function generateMealPlan() {
    if (!currentVeganType && !currentUser?.veganType) {
        showAlert('먼저 비건 타입 테스트를 완료해주세요.', 'warning');
        scrollToSection('vegan-test');
        return;
    }
    
    try {
        showLoading('식단을 생성하고 있습니다...');
        
        const response = await fetch('/api/meal-plan/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser?.id || 'guest',
                veganType: currentVeganType || currentUser?.veganType,
                preferences: {
                    cuisine: ['한식', '양식'],
                    difficulty: { max: 3 },
                    cookingTime: { max: 60 }
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayMealPlan(data.data);
            scrollToSection('meal-plan');
        } else {
            showAlert(data.message || '식단 생성에 실패했습니다.', 'danger');
        }
    } catch (error) {
        console.error('식단 생성 오류:', error);
        showAlert('식단 생성 중 오류가 발생했습니다.', 'danger');
    } finally {
        hideLoading();
    }
}

// 식단 표시
function displayMealPlan(mealPlan) {
    const container = document.getElementById('meal-plan-content');
    const resultSection = document.getElementById('meal-plan-result');
    
    let html = '';
    
    mealPlan.days.forEach((day, index) => {
        const dayNames = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
        const dayName = dayNames[index];
        
        html += `
            <div class="meal-day">
                <div class="day-header">
                    <div class="day-name">${dayName}</div>
                    <div class="day-date">${new Date(day.date).toLocaleDateString()}</div>
                </div>
                
                <div class="meals">
                    ${day.meals.breakfast ? `
                        <div class="meal-item">
                            <div class="meal-icon breakfast">
                                <i class="fas fa-sun"></i>
                            </div>
                            <div class="meal-info">
                                <div class="meal-name">아침</div>
                                <div class="meal-description">${day.meals.breakfast.recipe?.title || '추천 레시피'}</div>
                            </div>
                            <div class="meal-time">${day.meals.breakfast.time}</div>
                        </div>
                    ` : ''}
                    
                    ${day.meals.lunch ? `
                        <div class="meal-item">
                            <div class="meal-icon lunch">
                                <i class="fas fa-sun"></i>
                            </div>
                            <div class="meal-info">
                                <div class="meal-name">점심</div>
                                <div class="meal-description">${day.meals.lunch.recipe?.title || '추천 레시피'}</div>
                            </div>
                            <div class="meal-time">${day.meals.lunch.time}</div>
                        </div>
                    ` : ''}
                    
                    ${day.meals.dinner ? `
                        <div class="meal-item">
                            <div class="meal-icon dinner">
                                <i class="fas fa-moon"></i>
                            </div>
                            <div class="meal-info">
                                <div class="meal-name">저녁</div>
                                <div class="meal-description">${day.meals.dinner.recipe?.title || '추천 레시피'}</div>
                            </div>
                            <div class="meal-time">${day.meals.dinner.time}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    // 쇼핑 리스트 추가
    if (mealPlan.days[0]?.shoppingList) {
        html += `
            <div class="shopping-list">
                <h5><i class="fas fa-shopping-cart me-2"></i>쇼핑 리스트</h5>
                <div class="shopping-category">
                    <div class="category-title">필요한 재료</div>
                    ${mealPlan.days[0].shoppingList.map(item => `
                        <div class="shopping-item">
                            <span class="item-name">${item.ingredient}</span>
                            <span class="item-amount">${item.amount} ${item.unit}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    resultSection.classList.remove('d-none');
}

// 챗봇 메시지 전송
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 사용자 메시지 표시
    addChatMessage(message, 'user');
    input.value = '';
    
    try {
        const response = await fetch('/api/chatbot/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                userId: currentUser?.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addChatMessage(data.response.text, 'bot');
            
            // 제안 버튼 표시
            if (data.response.suggestions && data.response.suggestions.length > 0) {
                showChatSuggestions(data.response.suggestions);
            }
        } else {
            addChatMessage('죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.', 'bot');
        }
    } catch (error) {
        console.error('챗봇 오류:', error);
        addChatMessage('죄송합니다. 서버와의 연결에 문제가 있습니다.', 'bot');
    }
}

// 빠른 메시지 전송
function sendQuickMessage(message) {
    document.getElementById('chat-input').value = message;
    sendChatMessage();
}

// 챗 메시지 추가
function addChatMessage(message, type) {
    const container = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${message}
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// 챗 제안 표시
function showChatSuggestions(suggestions) {
    const container = document.getElementById('chat-container');
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'chat-suggestions mt-3';
    
    suggestionsDiv.innerHTML = `
        <div class="d-flex flex-wrap gap-2">
            ${suggestions.map(suggestion => `
                <button class="btn btn-outline-success btn-sm" onclick="sendQuickMessage('${suggestion}')">
                    ${suggestion}
                </button>
            `).join('')}
        </div>
    `;
    
    container.appendChild(suggestionsDiv);
    container.scrollTop = container.scrollHeight;
}

// 챗 입력 키 처리
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// 즐겨찾기 추가
function addToFavorites() {
    if (!currentUser) {
        showAlert('로그인이 필요합니다.', 'warning');
        return;
    }
    
    showAlert('즐겨찾기에 추가되었습니다!', 'success');
}

// 비건 타입 로드
async function loadVeganTypes() {
    try {
        const response = await fetch('/api/vegan-types');
        const data = await response.json();
        
        if (data.success) {
            // 비건 타입 데이터를 전역 변수에 저장하거나 사용
            window.veganTypes = data.data;
        }
    } catch (error) {
        console.error('비건 타입 로드 오류:', error);
    }
}

// 레시피 보기
function viewRecipes() {
    scrollToSection('recipes');
}

// 로딩 표시
function showLoading(message = '로딩 중...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
    loadingDiv.style.cssText = 'background: rgba(0,0,0,0.5); z-index: 9999;';
    
    loadingDiv.innerHTML = `
        <div class="bg-white p-4 rounded-3 text-center">
            <div class="loading-spinner mx-auto mb-3"></div>
            <div>${message}</div>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
}

// 로딩 숨기기
function hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// 알림 표시
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 자동 제거
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// 비건 테스트 질문 데이터
function getVeganTestQuestions() {
    return [
        {
            question: "어떤 식단을 선호하시나요?",
            options: [
                { label: "완전비건", description: "모든 동물성 식품을 피합니다", score: 5 },
                { label: "락토비건", description: "유제품은 허용하지만 알류와 육류는 피합니다", score: 4 },
                { label: "플렉시테리언", description: "가끔 육류나 생선을 먹을 수 있습니다", score: 3 },
                { label: "페스케테리언", description: "생선은 허용하지만 육류는 피합니다", score: 2 }
            ]
        },
        {
            question: "요리할 때 가장 중요하게 생각하는 것은?",
            options: [
                { label: "영양 균형", description: "건강한 영양소 조합이 최우선입니다", score: 5 },
                { label: "맛", description: "맛있는 음식이 가장 중요합니다", score: 4 },
                { label: "간편함", description: "빠르고 쉽게 만들 수 있는 것이 좋습니다", score: 3 },
                { label: "새로움", description: "새로운 재료나 조리법을 시도하는 것을 좋아합니다", score: 2 }
            ]
        },
        {
            question: "선호하는 요리 스타일은?",
            options: [
                { label: "전통적인 요리", description: "검증된 전통 레시피를 선호합니다", score: 5 },
                { label: "퓨전 요리", description: "다양한 문화의 요리를 조합하는 것을 좋아합니다", score: 4 },
                { label: "간단한 요리", description: "최소한의 재료로 만드는 요리를 선호합니다", score: 3 },
                { label: "고급 요리", description: "정교하고 세련된 요리를 좋아합니다", score: 2 }
            ]
        },
        {
            question: "식사 시간에 가장 중요하게 생각하는 것은?",
            options: [
                { label: "가족과 함께", description: "가족이 함께하는 시간이 중요합니다", score: 5 },
                { label: "건강한 식단", description: "영양적으로 균형잡힌 식사가 중요합니다", score: 4 },
                { label: "빠른 식사", description: "시간을 절약할 수 있는 것이 중요합니다", score: 3 },
                { label: "새로운 경험", description: "새로운 맛과 경험을 하는 것이 중요합니다", score: 2 }
            ]
        },
        {
            question: "비건 라이프를 선택한 주된 이유는?",
            options: [
                { label: "건강", description: "건강한 삶을 위해서입니다", score: 5 },
                { label: "환경 보호", description: "환경을 보호하기 위해서입니다", score: 4 },
                { label: "동물 보호", description: "동물을 보호하기 위해서입니다", score: 3 },
                { label: "새로운 경험", description: "새로운 경험을 해보고 싶어서입니다", score: 2 }
            ]
        }
    ];
}

