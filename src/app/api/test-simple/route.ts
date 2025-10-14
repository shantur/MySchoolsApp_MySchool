export async function GET() {
  console.log('SIMPLE TEST ROUTE CALLED');
  return new Response('Test route works!', { status: 200 });
}
