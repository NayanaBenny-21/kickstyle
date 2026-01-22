document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const confirmError = document.getElementById("confirmError");
  
  const nameRegex = /^[A-Za-z\s]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

  nameInput.addEventListener("input", () => {
    const name = nameInput.value.trim();
    if (!name) {
        nameError.textContent = 'Please enter your name';
    }else if (!nameRegex.test(name)) {
        nameError.textContent = 'Name should contain only alphabets';
    } else {
        nameError.textContent ='';
    }
  });

  emailInput.addEventListener("input", () =>{
const email = emailInput.valur.trim();
if(!email) {
    emailError.textContent = 'Please enter your email';   
} else if (!passwordRegex.test(email)) {
    emailError.textContent = 'Inavalid email address';
} else {
    emailError.textContent = '';
}
  });

  passwordInput.addEventListener("input", () => {
    const password = passwordInput.value.trim();
    if(!password) {
        passwordError.textContent = 'Please fill the password field.';
    } else if (!passwordRegex.test(password)) {
        "Password must have 8–12 chars, 1 letter, 1 number & 1 special char.";
    } else{
        passwordError.textContent ='';
    }
  });
confirmInput.addEventListener("input", () => {
  if (confirmInput.value.trim() !== passwordInput.value.trim()) {
    confirmError.textContent = "Passwords do not match";
  } else {
    confirmError.textContent = "";
  }
});

  //form submit validation

  form.addEventListener("submit", (e)=> {
 let valid = true;


    if (!nameInput.value.trim() || !nameRegex.test(nameInput.value.trim())) {
      nameError.textContent = "Please enter a valid name";
      valid = false;
    }

    if (
      !emailInput.value.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())
    ) {
      emailError.textContent = "Please enter a valid email";
      valid = false;
    }

    if (!passwordRegex.test(passwordInput.value.trim())) {
      passwordError.textContent =
        "Password must have 8–12 chars, 1 letter, 1 number & 1 special char.";
      valid = false;
    }

    if (confirmInput.value.trim() !== passwordInput.value.trim()) {
      confirmError.textContent = "Passwords do not match";
      valid = false;
    }
 if (!valid) e.preventDefault();
  });

});