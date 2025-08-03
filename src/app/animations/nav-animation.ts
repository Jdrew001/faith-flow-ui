import { AnimationController, Animation } from '@ionic/angular';

export const customNavAnimation = (baseEl: HTMLElement, opts?: any): Animation => {
  const animationCtrl = new AnimationController();
  
  // Create a fade animation instead of the default slide
  const rootAnimation = animationCtrl.create()
    .duration(opts.duration || 300)
    .easing('ease-in-out');

  const enteringAnimation = animationCtrl.create()
    .addElement(opts.enteringEl)
    .fromTo('opacity', '0', '1')
    .fromTo('transform', 'scale(0.95)', 'scale(1)');

  const leavingAnimation = animationCtrl.create()
    .addElement(opts.leavingEl)
    .fromTo('opacity', '1', '0')
    .fromTo('transform', 'scale(1)', 'scale(0.95)');

  rootAnimation.addAnimation([enteringAnimation, leavingAnimation]);

  return rootAnimation;
};