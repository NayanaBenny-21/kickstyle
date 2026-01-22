console.log("OTP JS loaded");
console.log("otpSent:", window.otpSent, "remainingTime:", window.remainingTime);

document.addEventListener("DOMContentLoaded", () => {
    const resend = document.getElementById("resend");
    const timerElement = document.getElementById("timer");
     const errorBox = document.getElementById('otpError');
    const form  = document.getElementById('loginOtpForm')
    let countdown = parseInt(window.remainingTime) || 0;
    let interval;
    let toastShown = false;

    function showToast(icon, text, redirect = null) {
        Swal.fire({
            icon,
            text,
            toast: true,
            position: "bottom",
            timer: 2500,
            showConfirmButton: false,
            width: 350,
            padding: '0.5em 1em',
            customClass: { popup: 'small-toast' }
        }).then(() => {
            if (redirect) {
                window.location.href = redirect;
            }
        })
    }

    function startTimer() {
        if (interval) clearInterval(interval);

        if (countdown <= 0) {
            timerElement.style.display = "none";
            resend.style.display = "inline-block";
            resend.disabled = false;
            return;
        }

        resend.style.display = "none";
        resend.disabled = true;
        timerElement.style.display = "inline";

        interval = setInterval(() => {
            const minutes = Math.floor(countdown / 60);
            const seconds = countdown % 60;
            timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds} left`;
            countdown--;

            if (countdown < 0) {
                clearInterval(interval);
                timerElement.textContent = "";
                timerElement.style.display = "none";
                resend.style.display = "inline-block";
                resend.disabled = false;
            }
        }, 1000);
    }


    // to start timer or show resend
    if (!window.otpSent || countdown <= 0) {
        resend.style.display = "inline-block";
        resend.disabled = false;
        timerElement.style.display = "none";
    } else if (window.otpSent && countdown > 0) {
        startTimer();

        // Only show toast if the server explicitly requested it
        if (window.showToast && !toastShown) {
            showToast("success", "OTP sent to your email");
            toastShown = true;
        }
    }
//verify the otp
form.addEventListener('submit', async(e) => {
    e.preventDefault();

  const email = document.querySelector('input[name="email"]').value;
  const otp = [...document.querySelectorAll(".otp-input")].map(i => i.value).join("");
  
  if( otp.length !== 4) {
    errorBox.textContent = "Enter valid 4-digit OTP";
    errorBox.style.display = 'block';
    return;
  }

  errorBox.style.display = 'none';
   try {
    const res = await fetch('/auth/login/verify-otp', {
        method : 'POST',
        headers : {'Content-Type' : 'application/json'},
        body : JSON.stringify({email,otp})
    });

const data = await res.json();
if(!data.success) {
    errorBox.textContent = data.message || 'Invalid OTP';
    errorBox.style.display = 'block';

    const otpInput = document.querySelectorAll('.otp-input');
    otpInput.forEach(input => input.value ='');
    otpInput[0].focus();
    return;
}
showToast("success", 'Login Successfull!');
 setTimeout(() => window.location.href = "/", 1200);
   } catch (err) {
            console.error(err);
            showToast("error", "Server error, try again");

   }

});

    // Resend OTP
resend.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
        const res = await fetch("/auth/login/resend-otp", { 
            method: "POST",
            credentials: "include",
            headers: { Accept: "application/json" }
        });

        const raw = await res.text();
        console.log("RAW SERVER RESPONSE:", raw);

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            showToast("error", "Invalid server response");
            return;
        }

        if (data.success) {
            showToast("success", "OTP sent to your email");
            countdown = 60;
            startTimer();
            errorBox.textContent = "";
            errorBox.style.display = "none";

            const otpInput = document.querySelectorAll(".otp-input");
            otpInput.forEach(input => (input.value = ""));
            otpInput[0].focus();
        } else {
            showToast("error", data.message || "Failed to resend OTP").then(() => {
                if (data.redirect) window.location.href = data.redirect;
            });
        }
    } catch (err) {
        console.error(err);
        showToast("error", "Something went wrong. Try again.");
    }
});



    // OTP input autofocus
    const inputs = document.querySelectorAll(".otp-input");
    inputs.forEach(input => {
        input.addEventListener("input", e => {
            if (isNaN(e.target.value)) e.target.value = '';
            else if (e.target.nextElementSibling && e.target.value !== '') input.nextElementSibling.focus();
        });
        input.addEventListener("keydown", e => {
            if (e.key === "Backspace" || e.key === "Delete") {
                e.preventDefault();
                if (input.value !== '') {
                    input.value = '';
                } else if (input.previousElementSibling) {
                    input.previousElementSibling.value = '';
                    input.previousElementSibling.focus();
                }

            }
        });
    });

});

