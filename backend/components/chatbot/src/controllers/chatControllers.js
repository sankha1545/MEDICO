export const handleChat = async (req, res) => {
  const { messages } = req.body;

  // Example: simple logic to simulate AI response
  const lastUserMsg = messages[messages.length - 1]?.content || '';

  let response = "Sorry, I can’t answer that.";

  if (/appointment|book|doctor/i.test(lastUserMsg)) {
    response = "You can book an appointment by clicking the 'Book Now' button on our homepage.";
  } else if (/services|available/i.test(lastUserMsg)) {
    response = "We offer general checkups, dental services, and specialist consultations.";
  }

  res.json({ answer: response });
};
