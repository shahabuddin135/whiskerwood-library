// In-app purchase hooks. The web build shows a friendly notice; in the native build,
// wire `window.WWL_IAP.purchase(id) => Promise<boolean>` to RevenueCat or
// cordova-plugin-purchase (see README) and rewards are granted here.
import { toast } from './ui/dom.js';

export const IAP_PRODUCTS = [
  { id: 'no_ads', title: 'No Break Ads', desc: 'Removes interstitial ads forever. Optional 📺 bonuses stay.', price: '$2.99', icon: '🚫' },
  { id: 'cheese_pouch', title: 'Pouch of Cheese', desc: '150 golden cheese', price: '$1.99', icon: '🧀', cheese: 150 },
  { id: 'cheese_barrel', title: 'Barrel of Cheese', desc: '1,000 golden cheese + 4h Story Hour', price: '$9.99', icon: '🛢️', cheese: 1000, story: 4 * 3600 },
];

export async function purchase(id, game) {
  const p = IAP_PRODUCTS.find((x) => x.id === id);
  if (!p) return false;
  if (!window.WWL_IAP?.purchase) {
    toast('Purchases are available in the mobile app version', '', 'shop');
    return false;
  }
  try {
    const ok = await window.WWL_IAP.purchase(id);
    if (!ok) return false;
    if (id === 'no_ads') game.s.removeAds = true;
    if (p.cheese) game.addCheese(p.cheese);
    if (p.story) game.addStoryHour(p.story);
    game.save();
    toast('Thank you for supporting the library!', 'gold', 'heart');
    return true;
  } catch (e) {
    console.warn('purchase failed', e);
    return false;
  }
}
