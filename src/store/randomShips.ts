export function getRandomShips() {
  return [
    {
      position: { x: 0, y: 5 },
      direction: false,
      type: 'huge',
      length: 4,
    },
    {
      position: { x: 5, y: 6 },
      direction: true,
      type: 'large',
      length: 3,
    },
    {
      position: { x: 7, y: 6 },
      direction: false,
      type: 'large',
      length: 3,
    },
    {
      position: { x: 1, y: 8 },
      direction: false,
      type: 'medium',
      length: 2,
    },
    {
      position: { x: 7, y: 9 },
      direction: false,
      type: 'medium',
      length: 2,
    },
    {
      position: { x: 5, y: 1 },
      direction: false,
      type: 'medium',
      length: 2,
    },
    {
      position: { x: 3, y: 2 },
      direction: true,
      type: 'small',
      length: 1,
    },
    {
      position: { x: 9, y: 0 },
      direction: true,
      type: 'small',
      length: 1,
    },
    {
      position: { x: 3, y: 0 },
      direction: true,
      type: 'small',
      length: 1,
    },
    {
      position: { x: 7, y: 3 },
      direction: true,
      type: 'small',
      length: 1,
    },
  ];
}
