document.addEventListener('DOMContentLoaded', function() {
    loadTopVolunteers();
    loadStatistics();
});

function loadTopVolunteers() {
    const container = document.getElementById('top-volunteers-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    fetch('/api/naseZvezde/top-volunteers')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(volunteers => {
            loadingIndicator.style.display = 'none';
            
            if (!volunteers || volunteers.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <div class="alert alert-info" role="alert">
                            Trenutno ni na voljo podatkov o prostovoljcih.
                        </div>
                    </div>
                `;
                return;
            }
            
            volunteers.forEach((volunteer, index) => {
                const hours = volunteer.opravljeneUre || 0;
                const badgeInfo = BadgeSystem.getBadgeInfo(hours);
                
                const card = `
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="card h-100 border-0 shadow-sm diagonalCorner">
                            <!-- Card Header with rank and name -->
                            <div class="card-header border-0 py-3 px-3" style="background-color: white;">
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-dark rounded-pill px-3 py-2 me-2">#${index + 1}</span>
                                    <h4 class="fw-bold mb-0">${volunteer.ime} ${volunteer.primek}</h4>
                                </div>
                            </div>
                            
                            <div class="card-body p-3">
                                <div class="d-flex flex-column gap-3">
                                    <!-- Badge -->
                                    <div class="badge w-100 text-white py-2 " style="background-color: ${badgeInfo.color}">
                                        <i class="fas ${badgeInfo.icon} me-1"></i>
                                        <span>${badgeInfo.name}</span>
                                    </div>
                                    
                                    <!-- Hours -->
                                    <div class="d-flex align-items-center p-2 bg-light rounded">
                                        <div class="me-3">
                                            <i class="fas fa-clock" style="color: ${badgeInfo.color}"></i>
                                        </div>
                                        <div>
                                            <h5 class="mb-0 fw-bold">${hours} ur</h5>
                                        </div>
                                    </div>
                                    
                                    <!-- Days -->
                                    <div class="d-flex align-items-center p-2 bg-light rounded">
                                        <div class="me-3">
                                            <i class="fas fa-calendar-alt" style="color: ${badgeInfo.color}"></i>
                                        </div>
                                        <div>
                                            <h5 class="mb-0 fw-bold">${Math.ceil(hours/8)} dni</h5>
                                        </div>
                                    </div>
                                    
                                    <!-- Skills -->
                                    <div class="d-flex align-items-center p-2 bg-light rounded">
                                        <div class="me-3">
                                            <i class="fas fa-tools" style="color: ${badgeInfo.color}"></i>
                                        </div>
                                        <div style="overflow-wrap: break-word; word-wrap: break-word;">
                                            <h5 class="mb-0 fw-bold">${volunteer.spretnost || 'Različne spretnosti'}</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', card);
            });
            
            const style = document.createElement('style');
            style.textContent = `
                .card { 
                    transition: transform 0.2s, box-shadow 0.2s; 
                    background: #ffffff;
                    overflow: hidden;
                }
                .card:hover { 
                    transform: translateY(-5px); 
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
                .card-header {
                    background-color: white !important;
                }
                .bg-light {
                    background-color: #f8f9fa !important;
                }
            `;
            document.head.appendChild(style);
        });
}

function loadStatistics() {
    fetch('/api/naseZvezde/statistics')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(stats => {
            document.getElementById('total-hours').textContent = stats.totalHours || 0;
            document.getElementById('total-volunteers').textContent = stats.totalVolunteers || 0;
            document.getElementById('total-projects').textContent = stats.totalProjects || 0;
            document.getElementById('total-organizations').textContent = stats.totalOrganizations || 0;
        });
}