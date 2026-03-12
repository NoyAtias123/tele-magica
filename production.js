const BACKEND_URL = "https://YOUR-APP-NAME.onrender.com";
 
 
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}
 
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
 
window.addEventListener('load', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type');
 
    if (!id) return;
 
    loadMediaDetails(id);
 
    if (type === 'serie') {
        document.getElementById('seasons-container').style.display = 'block';
        loadSeasons(id); 
    }
    else {
        loadSingleVideo(id);
    }
 
    const btnBack = document.getElementById("back_button");
    if (btnBack) {
        btnBack.onclick = () => window.history.back();
    }
});
 
async function loadMediaDetails(id) 
{
    const response = await fetch(`${BACKEND_URL}/get_item_details?id=${id}`);
    const data = await response.json();
    if (data.title) {
        document.getElementById('title-display').innerText = data.title;
        const poster = document.getElementById('item-poster');
        if (poster && data.image_url) {
            poster.src = data.image_url;
            poster.style.display = 'block';
        }
    }
}
 
async function loadSeasons(seriesId) 
{
    const response = await fetch(`${BACKEND_URL}/get_seasons_list?id=${seriesId}`);
    const seasons = await response.json();
    const list = document.getElementById('seasons-list');
    list.innerHTML = '';
    seasons.forEach(num => {
        const btn = document.createElement('button');
        btn.innerText = `Temporada ${num}`;
        btn.className = "season-button";
        btn.onclick = () => loadEpisodes(seriesId, num);
        list.appendChild(btn);
    });
}
 
async function loadEpisodes(seriesId, seasonNum) 
{
    const response = await fetch(`${BACKEND_URL}/get_episodes?id=${seriesId}&season=${seasonNum}`);
    const episodes = await response.json();
    const list = document.getElementById('episodes-list');
    document.getElementById('episodes-container').style.display = 'block';
    list.innerHTML = '';
    
    episodes.forEach(ep => {
        const btn = document.createElement('button');
        btn.innerText = `Capítulo ${ep.episode_num}`;
        btn.className = "episode-button";
        btn.onclick = () => {
            const videoCont = document.getElementById('video-container');
            const player = document.getElementById('video-player');
            videoCont.style.display = 'block';
            player.src = ep.youtube_link;
            
            document.getElementById('summary-section').style.display = 'block';
            document.getElementById('episode-summary').innerText = ep.summary || "No hay resumen disponible.";
            
            videoCont.scrollIntoView({ behavior: 'smooth' });
        };
        list.appendChild(btn);
    });
}
 
async function loadSingleVideo(id) 
{
    try {
        const response = await fetch(`${BACKEND_URL}/get_episodes?id=${id}`);
        const episodes = await response.json();
        
        if (episodes && episodes.length > 0) {
            const videoData = episodes[0]; 
            const videoCont = document.getElementById('video-container');
            const player = document.getElementById('video-player');
            
            if (videoCont && player) {
                videoCont.style.display = 'block';
                player.src = videoData.youtube_link;
                
                document.getElementById('summary-section').style.display = 'block';
                document.getElementById('episode-summary').innerText = videoData.summary || "No hay resumen disponible.";
            }
        } else {
            console.error("No se encontró información en episodes para ID:", id);
        }
    } catch (error) {
        console.error("Error loading single video:", error);
    }
}