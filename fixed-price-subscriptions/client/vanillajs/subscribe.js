// helper method for displaying a status message.
const setMessage = (message) => {
  const messageDiv = document.querySelector('#messages');
  messageDiv.innerHTML += "<br>" + message;
}

// Fetch public key and initialize Stripe.
let stripe, cardElement;

fetch('/config')
  .then((resp) => resp.json())
  .then((resp) => {
    stripe = Stripe(resp.publishableKey);

    const elements = stripe.elements();
    cardElement = elements.create('card');
    cardElement.mount('#card-element');
  });

// Extract the client secret query string argument. This is
// required to confirm the payment intent from the front-end.
const params = new URLSearchParams(window.location.search);
const subscriptionId = params.get('subscriptionId');
const clientSecret = params.get('clientSecret');

// This sample only supports a Subscription with payment
// upfront. If you offer a trial on your subscription, then
// instead of confirming the subscription's latest_invoice's
// payment_intent. You'll use stripe.confirmCardSetup to confirm
// the subscription's pending_setup_intent.
// See https://stripe.com/docs/billing/subscriptions/trials

// Payment info collection and confirmation
// When the submit button is pressed, attempt to confirm the payment intent 
// with the information input into the card element form.
// - handle payment errors by displaying an alert. The customer can update
//   the payment information and try again
// - Stripe Elements automatically handles next actions like 3DSecure that are required for SCA
// - Complete the subscription flow when the payment succeeds
const btn = document.querySelector('#submit-payment-btn');
btn.addEventListener('click', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('name');

  // Create payment method and confirm payment intent.
  stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: nameInput.value,
      },
    }
  }).then((result) => {
    if(result.error) {
      alert(result.error.message);
    } else {
      // Complete subscription setup and redirect the customer to their account page
      fetch('/complete-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
          paymentIntentId: result.paymentIntent.id,
        }),
      })
      .then((response) => response.json())
      .then((data) => {
        setMessage('Success! Redirecting to your account.');
        window.location.href = '/account.html';
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    }
  });
});