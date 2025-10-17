console.log("OTP JS loaded");
console.log("otpSent:", window.otpSent, "remainingTime:", window.remainingTime);

document.addEventListener("DOMContentLoaded", () => {
    const resend = document.getElementById("resend");
    const timerElement = document.getElementById("timer");

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
        }).then(()=>{
            if (redirect){
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

    if (countdown > 0 && !toastShown) {
        if(window.otpSent ) {
        showToast("success", "OTP sent to your email");
        toastShown = true;
        }

        startTimer();
    }

    // Resend OTP
    resend.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/auth/login/resend-otp", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                showToast("success", "OTP sent to your email");
                countdown = 60; // reset countdown only after successful resend
                startTimer();
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
            else if (e.target.nextElementSibling && e.target.value !== '')input.nextElementSibling.focus();
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

   
if (window.otpSuccess) {
    showToast("success", "Logged Successfully!", '/');
}
});
