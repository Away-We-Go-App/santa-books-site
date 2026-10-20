import test from 'node:test';
import assert from 'node:assert/strict';
import { footAt, LEG_PHASES } from '../public/home-leg-rig.mjs';
import { createRoute, motionAt } from '../public/home-walk.mjs';
const close = (a,b,epsilon=1e-7) => assert.ok(Math.abs(a-b)<epsilon, `${a} != ${b}`);

test('planted hooves retain their world position as the body travels',()=>{
  for(const phase of LEG_PHASES) {
    let previous;
    for(let d=-128;d<=128;d+=.1) {
      const foot=footAt(d,phase);
      if(previous?.foot.planted && foot.planted)
        close(previous.d+previous.foot.dx,d+foot.dx);
      previous={d,foot};
    }
  }
});
test('four staggered steps retain at least two ground contacts and never dip below the floor',()=>{
  for(let d=0;d<56;d+=.05) {
    const feet=LEG_PHASES.map(p=>footAt(d,p));
    assert.ok(feet.filter(f=>f.planted).length>=2);
    assert.ok(feet.every(f=>f.lift>=0 && f.lift<=9));
  }
  assert.ok(LEG_PHASES.every(p=>footAt(0,p,0).lift===0));
});
test('liftoff, landing and cycle wrap have continuous positions and velocities',()=>{
  const epsilon=1e-4;
  for(const phase of LEG_PHASES) for(const boundary of [.65,1]) {
    const d=(boundary-phase)*56;
    const left=footAt(d-epsilon,phase), right=footAt(d+epsilon,phase);
    close(left.dx,right.dx,.001); close(left.lift,right.lift,.001);
    close((footAt(d,phase).dx-left.dx)/epsilon,-1,.001);
    close((right.dx-footAt(d,phase).dx)/epsilon,-1,.001);
    close(left.lift/epsilon,0,.001); close(right.lift/epsilon,0,.001);
  }
});
test('arrival returns to the resting pose without selecting a different frame',()=>{
  const route=createRoute(-660,2320,.62);
  const before=motionAt(route.duration-1e-4,route);
  const after=motionAt(0,route);
  for(const phase of LEG_PHASES) {
    const a=footAt(before.x-route.meeting,phase,before.speed/route.speed), b=footAt(after.x-route.meeting,phase,0);
    close(a.dx,b.dx,.001); close(a.lift,b.lift,.001);
  }
});

test('a foreleg and a hindleg swing together during part of the walk',()=>{
  const feet=LEG_PHASES.map(p=>footAt(10,p));
  assert.equal(feet[2].planted,false); // left hind
  assert.equal(feet[3].planted,false); // left fore
  assert.equal(feet[0].planted,true);
  assert.equal(feet[1].planted,true);
});
