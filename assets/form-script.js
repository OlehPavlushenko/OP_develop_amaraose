window.addEventListener("DOMContentLoaded", () => {

  function validate(email) {
    const regular = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regular.test(email.toLowerCase());
  }

  function validateEmail() {
    const inputField = document.querySelectorAll("[data-verification]");

    if (inputField.length) {
      inputField.forEach(elem => {
        elem.addEventListener("change", () => {
          let value = elem.value.trim();

          if (elem.classList.contains("validate-error")) {
            elem.classList.remove("validate-error");
          } else if (elem.classList.contains("validate-true")) {
            elem.classList.remove("validate-true");
          }

          if (!validate(value) && value.length > 0) {
            elem.classList.add("validate-error")
          }
          if (validate(value)) {
            elem.classList.add("validate-true")
          }
        })
      })
    }
  }


  if(document.getElementById('RegisterForm-confirm_password')) {
    document.getElementById('RegisterForm-confirm_password').addEventListener('input', (event) => {
      validate_password();
    });
  }


  function validate_password() {
    const pass_input = document.getElementById('RegisterForm-password');
    const pass_input_value = pass_input.value;
    const confirm_pass_input = document.getElementById('RegisterForm-confirm_password');
    const confirm_pass_input_value = confirm_pass_input.value;
    const pass_alert = document.getElementById('wrong_pass_alert');
    const button = document.getElementById('customer-register__button');

    if (pass_input_value != confirm_pass_input_value) {
      pass_alert.style.color = 'red';
      pass_alert.innerHTML = 'Use same password';
      button.disabled = true;
      button.style.opacity = (0.4);
      pass_input.classList.remove('validate-true');
      confirm_pass_input.classList.remove('validate-true');
      pass_input.classList.add('validate-error');
      confirm_pass_input.classList.add('validate-error');
    } else {
      pass_alert.style.color = 'green';
      pass_alert.innerHTML = 'Password Matched';
      button.disabled = false;
      button.style.opacity = (1);
      pass_input.classList.remove('validate-error');
      confirm_pass_input.classList.remove('validate-error');
      pass_input.classList.add('validate-true');
      confirm_pass_input.classList.add('validate-true');
    }
  }



  validateEmail()
})
