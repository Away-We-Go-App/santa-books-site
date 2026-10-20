// Distances use the scene's logical coordinates. Speed is specified in CSS pixels.
export function createRoute(left, width, displayScale) {
  const speed = 38 / displayScale;
  const meeting = 314;
  const ramp = 2;
  const rampDistance = speed * ramp / 2;
  const start = Math.min(left - 160, meeting - rampDistance - 1);
  const end = left + width + 160;
  const outward = (end - meeting - rampDistance) / speed;
  const inward = (meeting - rampDistance - start) / speed;
  return { speed, meeting, ramp, rampDistance, start, end, outward, inward,
    duration: 5 + ramp + outward + .8 + inward + ramp };
}

export function motionAt(time, route) {
  let t = ((time % route.duration) + route.duration) % route.duration;
  const { speed, meeting, ramp, rampDistance, start, end, outward, inward } = route;
  const state = (segment, x, velocity, story) => ({segment, local: t, x, speed: velocity, story});
  if (t < 5) return state('greeting', meeting, 0, 8 + t);
  t -= 5;
  if (t < ramp) {
    const u = t / ramp;
    return state('departing', meeting + rampDistance * u * u, speed * u, 13 + t);
  }
  t -= ramp;
  if (t < outward) return state('outward', meeting + rampDistance + speed * t, speed, 15);
  t -= outward;
  if (t < .8) return state('offscreen', end, 0, 0);
  t -= .8;
  if (t < inward) return state('inward', start + speed * t, speed, 2);
  t -= inward;
  const u = Math.min(1, t / ramp);
  return state('arriving', meeting - rampDistance * (1 - u) ** 2, speed * (1 - u), 6 + t);
}

// Preserve a visible character's position when the viewport changes, rather than
// wrapping a different-duration timeline and teleporting it across the page.
export function retimeRoute(time, oldRoute, route) {
  if (!oldRoute) return time;
  const state = motionAt(time, oldRoute);
  const clamp = (value, max) => Math.max(0, Math.min(max, value));
  const outwardStart = 5 + route.ramp;
  const offscreenStart = outwardStart + route.outward;
  const inwardStart = offscreenStart + .8;
  const arrivingStart = inwardStart + route.inward;
  switch (state.segment) {
    case 'greeting': return state.local;
    case 'departing':
    case 'outward':
      if (state.x < route.meeting + route.rampDistance)
        return 5 + route.ramp * Math.sqrt(clamp((state.x - route.meeting) / route.rampDistance, 1));
      return outwardStart + clamp((state.x - route.meeting - route.rampDistance) / route.speed, route.outward);
    case 'offscreen': return offscreenStart + state.local;
    case 'inward':
    case 'arriving':
      if (state.x > route.meeting - route.rampDistance)
        return arrivingStart + route.ramp * (1 - Math.sqrt(clamp((route.meeting - state.x) / route.rampDistance, 1)));
      return inwardStart + clamp((state.x - route.start) / route.speed, route.inward);
  }
}
