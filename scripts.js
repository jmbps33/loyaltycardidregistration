let currentStep = 1;
        let applications = JSON.parse(localStorage.getItem('loyaltyApplications')) || [];
        let currentApplication = {};
        let isDrawing = false;
        let canvas, ctx;

        // Initialize signature canvas and load applications
        document.addEventListener('DOMContentLoaded', function() {
            canvas = document.getElementById('signatureCanvas');
            ctx = canvas.getContext('2d');
            
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
            
            // Touch events for mobile
            canvas.addEventListener('touchstart', handleTouch);
            canvas.addEventListener('touchmove', handleTouch);
            canvas.addEventListener('touchend', stopDrawing);
            

        });

        function nextStep(step) {
            if (step > currentStep && !validateCurrentStep()) {
                return;
            }
            
            // Hide current step
            document.getElementById(`step${currentStep}`).classList.add('hidden');
            document.getElementById(`step${currentStep}-indicator`).classList.remove('bg-white');
            document.getElementById(`step${currentStep}-indicator`).classList.add('bg-blue-300');
            
            // Show new step
            currentStep = step;
            document.getElementById(`step${currentStep}`).classList.remove('hidden');
            document.getElementById(`step${currentStep}-indicator`).classList.remove('bg-blue-300');
            document.getElementById(`step${currentStep}-indicator`).classList.add('bg-white');
            
            if (step === 4) {
                updateReviewInfo();
            }
        }

        function validateCurrentStep() {
            if (currentStep === 1) {
                const required = ['firstName', 'lastName', 'email', 'phone', 'address'];
                for (let field of required) {
                    if (!document.getElementById(field).value.trim()) {
                        alert('Please fill in all required fields.');
                        return false;
                    }
                }
            } else if (currentStep === 2) {
                if (!currentApplication.photo) {
                    alert('Please upload a photo.');
                    return false;
                }
            } else if (currentStep === 3) {
                if (!currentApplication.signature) {
                    alert('Please provide your signature.');
                    return false;
                }
            }
            return true;
        }

        function handlePhotoUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentApplication.photo = e.target.result;
                    const preview = document.getElementById('photoPreview');
                    preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-lg">`;
                };
                reader.readAsDataURL(file);
            }
        }

        function startDrawing(e) {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        }

        function draw(e) {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        }

        function stopDrawing() {
            if (isDrawing) {
                isDrawing = false;
                currentApplication.signature = canvas.toDataURL();
            }
        }

        function handleTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                            e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }

        function clearSignature() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            currentApplication.signature = null;
        }

        function updateReviewInfo() {
            const suffixValue = document.getElementById('suffix').value;
            const fullName = `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}${suffixValue ? ' ' + suffixValue : ''}`;
            const info = `
                <div><strong>Name:</strong> ${fullName}</div>
                <div><strong>Email:</strong> ${document.getElementById('email').value}</div>
                <div><strong>Phone:</strong> ${document.getElementById('phone').value}</div>
                <div><strong>Address:</strong> ${document.getElementById('address').value}</div>
                <div><strong>Photo:</strong> ${currentApplication.photo ? 'Uploaded' : 'Not uploaded'}</div>
                <div><strong>Signature:</strong> ${currentApplication.signature ? 'Provided' : 'Not provided'}</div>
            `;
            document.getElementById('reviewInfo').innerHTML = info;
        }

        function submitRegistration() {
            if (!validateCurrentStep()) return;
            
            // Generate claim stub number
            const stubNumber = 'CS' + Date.now().toString().slice(-8);
            const issueDate = new Date().toLocaleDateString();
            
            // Collect all data
            const application = {
                stubNumber: stubNumber,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                suffix: document.getElementById('suffix').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                photo: currentApplication.photo,
                signature: currentApplication.signature,
                issueDate: issueDate,
                status: 'NOT CLAIMED'
            };
            
            // Save to localStorage
            applications.push(application);
            localStorage.setItem('loyaltyApplications', JSON.stringify(applications));
            
            // Generate claim stub
            generateClaimStub(application);
            
            // Show claim stub
            document.getElementById('registrationForm').classList.add('hidden');
            document.getElementById('claimStub').classList.remove('hidden');
        }

        function generateClaimStub(application) {
            document.getElementById('stubNumber').textContent = application.stubNumber.toUpperCase();
            const fullName = `${application.firstName.toUpperCase()} ${application.lastName.toUpperCase()}${application.suffix ? ' ' + application.suffix.toUpperCase() : ''}`;
            document.getElementById('stubName').textContent = fullName;
            document.getElementById('stubAddress').textContent = application.address.toUpperCase();
            document.getElementById('issueDate').textContent = application.issueDate.toUpperCase();
        }

        function printStub() {
            window.print();
        }

        function downloadStub() {
            // Create a new window with just the stub content
            const stubContent = document.querySelector('.claim-stub').outerHTML;
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Loyalty Card Claim Stub</title>
                    <style>
                        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                        .claim-stub { width: 8.5in; height: 5.5in; }
                    </style>
                </head>
                <body>
                    ${stubContent}
                </body>
                </html>
            `);
            newWindow.document.close();
            setTimeout(() => {
                newWindow.print();
                newWindow.close();
            }, 500);
        }

        function backToMain() {
            document.getElementById('claimStub').classList.add('hidden');
            document.getElementById('registrationForm').classList.remove('hidden');
            
            // Reset form
            resetForm();
        }

        function showAdminPortal() {
            document.getElementById('registrationForm').classList.add('hidden');
            document.getElementById('adminPortal').classList.remove('hidden');
            loadApplications();
        }

        function showRegistrationForm() {
            document.getElementById('adminPortal').classList.add('hidden');
            document.getElementById('registrationForm').classList.remove('hidden');
        }

        function resetForm() {
            currentStep = 1;
            currentApplication = {};
            document.querySelectorAll('input, textarea').forEach(input => input.value = '');
            document.getElementById('photoPreview').innerHTML = `
                <div class="text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <p>Upload Photo</p>
                </div>
            `;
            clearSignature();
            
            // Reset step indicators
            document.querySelectorAll('[id$="-indicator"]').forEach(indicator => {
                indicator.classList.remove('bg-white');
                indicator.classList.add('bg-blue-300');
            });
            document.getElementById('step1-indicator').classList.add('bg-white');
            document.getElementById('step1-indicator').classList.remove('bg-blue-300');
            
            // Show step 1
            document.querySelectorAll('[id^="step"]').forEach(step => {
                if (!step.id.includes('indicator')) {
                    step.classList.add('hidden');
                }
            });
            document.getElementById('step1').classList.remove('hidden');
        }

        function loadApplications() {
            const tbody = document.getElementById('applicationsBody');
            tbody.innerHTML = '';
            
            if (applications.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                            No applications yet. Complete a registration to see it appear here.
                        </td>
                    </tr>
                `;
                return;
            }
            
            applications.forEach((app, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-300 px-4 py-2">${app.stubNumber}</td>
                    <td class="border border-gray-300 px-4 py-2">${app.firstName} ${app.lastName}</td>
                    <td class="border border-gray-300 px-4 py-2">${app.suffix || '-'}</td>
                    <td class="border border-gray-300 px-4 py-2">${app.email}</td>
                    <td class="border border-gray-300 px-4 py-2">${app.phone}</td>
                    <td class="border border-gray-300 px-4 py-2">
                        <img src="${app.photo}" class="w-16 h-16 object-cover rounded">
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                        <img src="${app.signature}" class="w-20 h-10 object-contain border rounded">
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                        <span class="px-2 py-1 rounded text-sm font-medium ${app.status === 'CLAIMED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${app.status}
                        </span>
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                        <button onclick="toggleStatus(${index})" class="px-3 py-1 rounded text-sm font-medium ${app.status === 'CLAIMED' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'} transition duration-200 mb-1">
                            ${app.status === 'CLAIMED' ? 'Mark Not Claimed' : 'Mark Claimed'}
                        </button>
                        <br>
                        <button onclick="printApplication(${index})" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition duration-200 mb-1">
                            Print Stub
                        </button>
                        <br>
                        <button onclick="deleteApplication(${index})" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition duration-200">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function toggleStatus(index) {
            applications[index].status = applications[index].status === 'CLAIMED' ? 'NOT CLAIMED' : 'CLAIMED';
            localStorage.setItem('loyaltyApplications', JSON.stringify(applications));
            loadApplications();
        }

        function printApplication(index) {
            const app = applications[index];
            generateClaimStub(app);
            
            // Create print window
            const stubContent = document.querySelector('.claim-stub').outerHTML;
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Loyalty Card Claim Stub - ${app.stubNumber}</title>
                    <style>
                        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                        .claim-stub { width: 8.5in; height: 5.5in; }
                        @media print {
                            body { margin: 0; padding: 0; }
                            .claim-stub { margin: 0; padding: 20px; box-sizing: border-box; }
                        }
                    </style>
                </head>
                <body>
                    ${stubContent}
                </body>
                </html>
            `);
            newWindow.document.close();
            setTimeout(() => {
                newWindow.print();
                newWindow.close();
            }, 500);
        }

        function deleteApplication(index) {
            const app = applications[index];
            if (confirm(`Are you sure you want to delete the application for ${app.firstName} ${app.lastName}? This action cannot be undone.`)) {
                applications.splice(index, 1);
                localStorage.setItem('loyaltyApplications', JSON.stringify(applications));
                loadApplications();
            }
        }