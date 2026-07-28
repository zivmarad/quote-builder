import { permanentRedirect } from 'next/navigation';

/** הפניה קבועה לסל – דף הצ'קאוט הוא בעצם הסל. */
export default function CheckoutPage() {
  permanentRedirect('/cart');
}
