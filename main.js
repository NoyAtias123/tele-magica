const BACKEND_URL = "https://YOUR-APP-NAME.onrender.com";
 
 
function handleBack() 
{
    /*
    A function that go to the last window that was open
    */
    window.history.back();
}
 
 
function openNav() 
{
    /*
    A function that opens the side menu bar to the decided size when the user clicked to open it
    */
    document.getElementById("mySidenav").style.width = "250px";
}
 
function closeNav() 
{
    /*
    A function that closes the side menu bar when the user clicked on the X
    */
    document.getElementById("mySidenav").style.width = "0";
}
 
function openAuth(mode) 
{
    /*
    A function that change the title of the page and the look of the page by the clicked button (signup/login)
    */
    const box = document.getElementById('authContainer'); 
    const titleElement = document.getElementById('title');
    // If the element is not in the page
    if (!box){return;}
    box.style.display = 'block'; 
    if (mode === 'signup') 
    {
        document.title = "Sign Up - Tela Mágica";
        // Change the mode
        box.classList.add('signup-mode');
        box.classList.remove('login-mode');
        // Change title by mode
        if (titleElement) titleElement.innerText = "¡Únete a nosotros!";
    }
    else
    {
        document.title = "Login - Tela Mágica";
        // Change the mode
        box.classList.add('login-mode');
        box.classList.remove('signup-mode');
        // Change title by mode
        if (titleElement) titleElement.innerText = "¡Bienvenido/a de nuevo!";
    }
}
 
 
function handleAuthSubmit(event)
{
    /*
    A function that handle when submit is clicked
    */
    event.preventDefault();
    // Get email and password
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Get name (if there is a name input, else it will be "")
    let fullName = "";
    const nameField = document.getElementById('fullName');
    if (nameField)
    {
        fullName = nameField.value;
    }
    // put the data from the user in object
    const userData = {fullName, email, password};
    const authBox = document.getElementById('authContainer');
    const isLogin = authBox.classList.contains('login-mode');
 
    // 🔧 שינוי 2: שימוש במשתנה BACKEND_URL במקום כתובת קשיחה
    let url = isLogin ? `${BACKEND_URL}/login` : `${BACKEND_URL}/signup`;
    
    // Get the information from the app code (python) - sql database
    fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(userData),
    credentials: 'include'
    })
    // Convert the data to json
    .then(res => res.json())
    // Send the answer of the proccess to the user with alert
    .then(data => alert(data.message))
    // Cath error if there is
    .catch(err => console.error("Error:", err));
}
 
 
// works in background - does not freeze the user's screen
async function handleLogout()
{
    try{
        // 🔧 שינוי 3: שימוש במשתנה BACKEND_URL
        const response = await fetch(`${BACKEND_URL}/logout`, {
            method: 'GET',
            credentials: 'include'
            });
        // If the returned status is ok
        if (response.ok)
        {
            // Send the answer of the proccess to the user with alert
            alert("¡Has cerrado sesión exitosamente!");
            // 🔧 שינוי 4: תיקון הנתיב המקומי - עכשיו מפנה לדף הבית של האתר
            window.location.href = "index.html";
        }
    }
    catch (error) 
    {
        console.error("Logout failed", error);
    }
}
 
 
// works in background - does not freeze the user's screen
async function loadUserProfile() {
    try {
        // 🔧 שינוי 5: שימוש במשתנה BACKEND_URL
        const response = await fetch(`${BACKEND_URL}/get_user_data`, {
            method: 'GET',
            credentials: 'include'
            });
                
        if (response.ok)
        {
            const data = await response.json();
            document.getElementById('user-name').innerText = data.name;
            document.getElementById('user-email').innerText = data.email;
        } 
        else 
        {
            document.getElementById('user-name').innerText = "No conectado";
            document.getElementById('user-email').innerText = "";
            window.location.href = "auth.html?mode=login"; 
        }
    }
    catch (error)
    {
        console.error("Error:", error);
    }
}
 
 
async function handleSearch(event) {
    const query = event.target.value;
    const searchGrid = document.getElementById('search_results');
 
    if (!searchGrid) return;
 
    if (query.length < 2)
    {
        searchGrid.innerHTML = '';
        searchGrid.style.display = 'none';
        return;
    }
 
    try 
    {
        // 🔧 שינוי 6: שימוש במשתנה BACKEND_URL
        const response = await fetch(`${BACKEND_URL}/search?q=${query}`);
        const results = await response.json();
        
        if (results.length > 0) 
        {
            searchGrid.style.display = 'flex';
            displayResults(results);
        }
        else 
        {
            searchGrid.innerHTML = '<div class="search-item">No se encontraron resultados</div>';
            searchGrid.style.display = 'flex';
        }
    } 
    catch (error) 
    {
        console.error("Error fetching search results:", error);
    }
}
 
 
function displayResults(results) 
{
    const searchGrid = document.getElementById('search_results'); 
    searchGrid.innerHTML = ''; 
 
    results.forEach(item => {
        const resultCard = `
            <div class="search-item" onclick="goToProduction(${item.id}, '${item.type}')" style="cursor: pointer;">
                <img src="${item.image_url}">
                <span>${item.title}</span>
            </div>
        `;
        searchGrid.innerHTML += resultCard;
    });
}
 
 
function getContentType() 
{
    const params = new URLSearchParams(window.location.search);
    return params.get('type');
}
 
async function loadContent() {
    const container = document.getElementById('catalog-container');
    if (!container) {
        return; 
    }
    const type = getContentType();
    if (!type) return;
 
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
        titleElement.innerText = "Explorar " + type;
    }
 
    try {
        // 🔧 שינוי 7: שימוש במשתנה BACKEND_URL
        const response = await fetch(`${BACKEND_URL}/get_catalog_data?type=${type}`);
        const data = await response.json();
 
        container.innerHTML = '';
 
        data.forEach(item => {
            container.innerHTML += `
            <div class="card" 
                onclick="goToProduction(${item.id}, '${type}')" 
                style="margin: 10px; padding: 10px; display: inline-block; cursor: pointer;">
            
                <img src="${item.image_url}" 
                    alt="${item.title}" 
                    style="width: 150px; height: 200px; object-fit: cover;">
            
                <h3>${item.title}</h3>
            </div>
        `;
    });
    } catch (error) 
    {
        console.error("Error:", error);
    }
}
 
document.addEventListener('DOMContentLoaded', loadContent);
 
function goToProduction(id, type) 
{
    window.location.href = `production.html?id=${id}&type=${type}`;
}
 
// Works while the page is loading and while using the page (for buttons mostly)
window.onload = function() 
{
    // Find mode
    const params = new URLSearchParams(window.location.search);
    const modeFromURL = params.get('mode');
    // If there is
    if (modeFromURL) 
    {
        openAuth(modeFromURL);
    } 
    else 
    {
        openAuth('login');
    }
    const authForm = document.getElementById('authForm');
    if (authForm) 
    {
        authForm.addEventListener('submit', handleAuthSubmit);
    }
    // Create the back button
    const button_back = document.getElementById("back_button");
 
    //Check if there is a back button in the window
    if (button_back)
    {
        button_back.addEventListener("click", handleBack);
    }
 
    const button_logout = document.getElementById("logout_button");
    // Check if there is a logout button in the window
    if (button_logout)
    {
        button_logout.addEventListener("click", handleLogout);
    }
 
    // Call the function to load the data about the user
    if (document.getElementById('user-name')) {
        loadUserProfile();
    }
};