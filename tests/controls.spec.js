// 3D controls on phones and computers: the round joystick walks in any direction (further = faster), one-finger
// drag turns the view 360°, two fingers pinch to zoom and twist to turn, the mouse wheel zooms. No view buttons.
const {test,expect}=require('./fixtures');const {watch}=require('./helpers');
const touch=(page,type,id,x,y)=>page.evaluate(([type,id,x,y])=>document.querySelector(type.target).dispatchEvent(new PointerEvent(type.name,{pointerId:id,pointerType:'touch',isPrimary:id===1,clientX:x,clientY:y,buttons:type.name==='pointerup'?0:1,bubbles:true,cancelable:true})),[type,id,x,y]);
test('joystick walks, drag turns 360°, pinch zooms, and the old view panel is gone',async({page})=>{test.setTimeout(180_000);const errors=watch(page);
  await page.goto('/phibun/?quality=low');await page.fill('#playerName','Ploy');await page.click('#startBtn');
  await expect.poll(()=>page.evaluate(()=>!!window.storyStatus)).toBe(true);await page.waitForTimeout(800);
  for(const id of ['zoomIn','zoomOut','cameraReset','rotateLeft','rotateRight'])await expect(page.locator('#'+id)).toHaveCount(0);
  await expect(page.locator('.dpad')).toHaveCount(0);await expect(page.locator('#joystick')).toBeVisible();
  // joystick: hold the knob up-right for a moment
  const st=()=>page.evaluate(()=>storyStatus());const before=(await st()).position;
  const box=await page.locator('#joystick').boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
  const J={name:'pointerdown',target:'#joystick'};
  await touch(page,J,5,cx,cy);await touch(page,{...J,name:'pointermove'},5,cx+40,cy-40);
  await expect(page.locator('#joystick')).toHaveClass(/active/);await page.waitForTimeout(1500);
  await touch(page,{...J,name:'pointerup'},5,cx+40,cy-40);await expect(page.locator('#joystick')).not.toHaveClass(/active/);
  const after=(await st()).position;expect(Math.hypot(after.x-before.x,after.z-before.z)).toBeGreaterThan(.3);
  // one finger drag on the scene turns the view
  const C={name:'pointerdown',target:'canvas'},cam0=(await st()).camera;
  await touch(page,C,1,600,400);await touch(page,{...C,name:'pointermove'},1,760,400);await touch(page,{...C,name:'pointerup'},1,760,400);
  const cam1=(await st()).camera;expect(Math.abs(cam1.yaw-cam0.yaw)).toBeGreaterThan(1);           // ~1.3 rad for 160 px
  // two fingers: spread apart = zoom in (smaller distance factor), twist = turn
  await touch(page,C,1,550,400);await touch(page,C,2,650,400);
  await touch(page,{...C,name:'pointermove'},1,450,400);await touch(page,{...C,name:'pointermove'},2,750,400);
  const cam2=(await st()).camera;expect(cam2.zoom).toBeLessThan(cam1.zoom*.6);
  await touch(page,{...C,name:'pointermove'},2,600,550);                                            // twist the second finger round
  const cam3=(await st()).camera;expect(Math.abs(cam3.yaw-cam2.yaw)).toBeGreaterThan(.3);
  await touch(page,{...C,name:'pointerup'},1,450,400);await touch(page,{...C,name:'pointerup'},2,600,550);
  // mouse wheel still zooms on computers
  await page.mouse.move(640,400);await page.mouse.wheel(0,600);await expect.poll(async()=>(await st()).camera.zoom).toBeGreaterThan(cam3.zoom);
  expect(errors).toEqual([]);});
