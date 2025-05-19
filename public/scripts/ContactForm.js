document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    // EmailJS public key
    emailjs.init("J4l84it_WqhepM6S5");

    const validateForm = (form) => {
        let isValid = true;
        
        // samo vse validacije bam bam bam simple easy
        const name = form.querySelector('#name');
        if (name.value.trim().length < 2) {
            showError(name, 'Ime mora vsebovati vsaj 2 znaka');
            isValid = false;
        }

        // email
        const email = form.querySelector('#email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            showError(email, 'Vnesite veljaven email naslov');
            isValid = false;
        }

        // tel.st
        const phone = form.querySelector('#phone');
        if (phone.value) {
            const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3,6}$/;
            if (!phoneRegex.test(phone.value)) {
                showError(phone, 'Vnesite veljavno telefonsko številko');
                isValid = false;
            }
        }

        // sporocilo
        const message = form.querySelector('#message');
        if (message.value.trim().length < 10) {
            showError(message, 'Sporočilo mora vsebovati vsaj 10 znaka');
            isValid = false;
        }

        return isValid;
    };

    const showError = (element, message) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback d-block';
        errorDiv.innerText = message;
        element.classList.add('is-invalid');
        
        const existing = element.parentElement.querySelector('.invalid-feedback');
        // ce se kaksi error za input pokaze se tu zbrise te
        if (existing) {
            existing.remove();
        }
        
        element.parentElement.appendChild(errorDiv);
    };

    const clearErrors = () => {
        document.querySelectorAll('.is-invalid').forEach(element => {
            element.classList.remove('is-invalid');
        });
        document.querySelectorAll('.invalid-feedback').forEach(element => {
            element.remove();
        });
    };

    const sendEmail = async (formData) => {
        try {
            const templateParams = {
                from_name: document.getElementById('name').value,
                from_email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            const response = await emailjs.send(
                "service_awsk3oj", // ID service
                "template_8aqqxie", // ID od templata
                templateParams
            );

            if (response.status === 200) {
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    contactForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        
        if (validateForm(this)) {
            const formData = new FormData(this);
            const loadingButton = this.querySelector('button[type="submit"]');
            
            loadingButton.disabled = true;
            loadingButton.innerHTML = 'Pošiljam...';

            const emailSent = await sendEmail(formData);
            if (emailSent) {
                await Swal.fire({
                    title: 'Sporočilo poslano!',
                    text: 'Hvala za vaše sporočilo! Odgovorili vam bomo v najkrajšem možnem času.',
                    icon: 'success',
                    confirmButtonText: 'V redu',
                    iconColor: 'var(--bs-main)',
                    confirmButtonColor: 'var(--bs-main)',
                    background: '#1a1a1a',
                    color: '#fff'
                    });
                    this.reset();
                    } else {
                        await Swal.fire({
                            title: 'Napaka!',
                            text: 'Prišlo je do napake pri pošiljanju sporočila. Prosimo, poskusite kasneje.',
                            icon: 'error',
                            confirmButtonText: 'V redu',
                            confirmButtonColor: 'var(--bs-main)',
                            iconColor: 'var(--bs-main)',
                            background: '#1a1a1a',
                            color: '#fff'
                        });
                    }
                    loadingButton.disabled = false;
                    loadingButton.innerHTML = 'Pošlji sporočilo';
        }
    });
});