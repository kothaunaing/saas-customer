import assert from 'node:assert/strict';
import test from 'node:test';
import { canCustomerManage, minutes } from '../customer/lib/booking.ts';

test('converts booking time to minutes', () => {
  assert.equal(minutes('09:30'), 570);
});

test('allows cancellation and rescheduling only 24 hours ahead', () => {
  const booking = {
    date: '2026-09-15',
    time: '10:00',
    status: 'Confirmed',
  };
  assert.equal(canCustomerManage(booking, '2026-09-14T03:30:00Z'), true);
  assert.equal(canCustomerManage(booking, '2026-09-14T04:00:01Z'), false);
  assert.equal(canCustomerManage({ ...booking, status: 'Cancelled' }, '2026-09-01T00:00:00Z'), false);
});
