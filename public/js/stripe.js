const stripe = Stripe(
  'pk_test_51NzXDaIWnz9hd34ezEVptNdGLcq822efqkQ6c2edSUGEgIHEoo1WOSR4hamebxPArHGsBeA1rTrdDm5dpqdnsp4000gEMg5xyb',
);
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    //1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:4000/api/v1/bookings/checkout-session/${tourId}`,
    );
    // console.log(session);
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });

    //2) Create checkout from + charge credit card
  } catch (err) {
    showAlert('error', err);
  }
};
