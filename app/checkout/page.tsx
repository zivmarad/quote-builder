import { redirect } from 'next/navigation';

/** הפניה לסל – דף הצ'קאוט הוא בעצם הסל. */
export default function CheckoutPage() {
  redirect('/cart');
}
