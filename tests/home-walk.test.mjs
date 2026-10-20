import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoute, motionAt, retimeRoute } from '../public/home-walk.mjs';
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-5, `${a} != ${b}`);
const routeFor = (width,height) => createRoute((1000-width*640/height)/2,width*640/height,height/640);
test('mobile and desktop cruise at 38 CSS pixels per second and clear both viewport edges',()=>{
  for(const [w,h] of [[390,362],[1440,396.8],[1920,396.8]]) {
    const r=routeFor(w,h);
    close((motionAt(9,r).x-motionAt(8,r).x)*h/640,38);
    assert.ok(r.start < (1000-w*640/h)/2-120);
    assert.ok(r.end > (1000+w*640/h)/2+120);
  }
});
test('greeting preserves the five-second glance and bow; visible transitions are continuous',()=>{
  const r=routeFor(1440,396.8);
  close(motionAt(0,r).story,8);
  close(motionAt(4.9,r).story,12.9);
  const arrival=7+r.outward+.8+r.inward;
  for(const t of [5,7,arrival,r.duration]) {
    close(motionAt(t-1e-8,r).x,motionAt(t+1e-8,r).x);
    close(motionAt(t-1e-8,r).speed,motionAt(t+1e-8,r).speed);
  }
});
test('resizing a desktop route retains a visible walking position and greeting progress',()=>{
  const before=routeFor(1440,396.8),after=routeFor(1920,396.8);
  for(const t of [2.8,6,10, before.duration-3,before.duration-1]) {
    const mapped=retimeRoute(t,before,after);
    close(motionAt(t,before).x,motionAt(mapped,after).x);
    assert.equal(motionAt(t,before).segment,motionAt(mapped,after).segment);
  }
});
test('changing display scale preserves position during acceleration and braking',()=>{
  const before=routeFor(390,362),after=routeFor(1440,396.8);
  for(const t of [5.1,6,6.99,before.duration-1.99,before.duration-1,before.duration-.1])
    close(motionAt(t,before).x,motionAt(retimeRoute(t,before,after),after).x);
});
