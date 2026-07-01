const Content = require('../models/Content');
const Plan = require('../models/Plan');

// @desc    Process user chat queries and return smart dynamic recommendations
// @route   POST /api/chatbot
// @access  Private
const handleChatbotQuery = async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ reply: "Please enter a message!" });
  }

  const query = message.toLowerCase().trim();

  try {
    // 1. Scan for greetings & general help
    if (
      query === 'hi' ||
      query === 'hello' ||
      query === 'hey' ||
      query.includes('who are you') ||
      query.includes('help')
    ) {
      return res.json({
        reply: `Hi ${req.user.name || 'there'}! 👋 I am your personal Streaming Assistant. I can help you search our catalog, recommend movies/series by genre, check ratings, and explain subscription options.

Try asking me:
*   *"Recommend some Sci-Fi contents"*
*   *"Tell me about Cosmic Odysseys"*
*   *"What are the subscription pricing plans?"*`
      });
    }

    // 2. Fetch all content to run matching titles or generic keywords
    const allContents = await Content.find({});
    
    // Check if the user is asking about a specific movie/series title in the database
    let matchingItem = null;
    for (const item of allContents) {
      if (query.includes(item.title.toLowerCase())) {
        matchingItem = item;
        break;
      }
    }

    if (matchingItem) {
      const genresStr = matchingItem.genres.join(', ');
      const castStr = matchingItem.cast.join(', ') || 'N/A';
      return res.json({
        reply: `Here are the details for **${matchingItem.title}** (${matchingItem.type === 'movie' ? '🎬 Movie' : '📺 Web Series'}):

*   **Rating**: ⭐ ${matchingItem.rating > 0 ? matchingItem.rating.toFixed(1) : 'Not Rated'} / 5.0
*   **Genres**: ${genresStr}
*   **Release Year**: ${matchingItem.releaseYear}
*   **Cast**: ${castStr}
*   **Synopsis**: ${matchingItem.description}

*Would you like to start watching this content? Type its name and go to the Library to play it!*`
      });
    }

    // 3. Scan for genre request keywords
    const genresList = ['action', 'sci-fi', 'scifi', 'adventure', 'fantasy', 'thriller', 'animation', 'drama', 'documentary', 'mystery'];
    let matchedGenre = null;

    for (const gen of genresList) {
      if (query.includes(gen)) {
        matchedGenre = gen;
        break;
      }
    }

    if (matchedGenre) {
      // Find contents matching this genre (regex case-insensitive)
      // Normalize 'scifi' query to search for 'Sci-Fi'
      const searchQuery = matchedGenre === 'scifi' ? 'Sci-Fi' : matchedGenre;
      const recommendations = await Content.find({
        genres: { $regex: new RegExp(searchQuery, 'i') }
      }).limit(3);

      if (recommendations.length > 0) {
        let responseText = `I found these top recommendations for the **${searchQuery.toUpperCase()}** genre in our library:\n\n`;
        recommendations.forEach((item, idx) => {
          responseText += `${idx + 1}. **${item.title}** (${item.type === 'movie' ? 'Movie' : 'Web Series'})\n`;
          responseText += `   ⭐ Rating: ${item.rating > 0 ? item.rating.toFixed(1) : 'New'} / 5.0\n`;
          responseText += `   📝 Synopsis: ${item.description}\n\n`;
        });
        responseText += `*Just search for the title in the Content Library to start streaming!*`;
        return res.json({ reply: responseText });
      } else {
        return res.json({
          reply: `I couldn't find any contents matching the **${searchQuery}** genre in our database at the moment, but check out our home page for trending titles!`
        });
      }
    }

    // 4. Scan for Pricing / Subscription inquiries
    if (
      query.includes('plan') ||
      query.includes('price') ||
      query.includes('pricing') ||
      query.includes('subscribe') ||
      query.includes('membership') ||
      query.includes('premium') ||
      query.includes('vip')
    ) {
      const plans = await Plan.find({});
      let plansText = `We offer the following subscription tiers to unlock premium streaming and features:\n\n`;
      plans.forEach((plan) => {
        plansText += `*   **${plan.name}**: ₹${plan.price} / ${plan.durationMonths > 1 ? `${plan.durationMonths} months` : 'month'}\n`;
        plansText += `    *Features: ${plan.features.join(', ')}*\n\n`;
      });
      plansText += `Go to the **Plans** tab on the top menu to complete a mock card payment and upgrade your account!`;
      return res.json({ reply: plansText });
    }

    // 5. General Search Fallback: Check if message contains keywords in catalog descriptions
    const searchMatches = await Content.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(2);

    if (searchMatches.length > 0) {
      let responseText = `I searched our catalog for "${message}" and found these matches:\n\n`;
      searchMatches.forEach((item) => {
        responseText += `*   **${item.title}** (${item.type}) — ⭐ ${item.rating > 0 ? item.rating.toFixed(1) : 'New'}/5.0\n`;
        responseText += `    Description: ${item.description}\n\n`;
      });
      return res.json({ reply: responseText });
    }

    // 6. Default fallback response
    res.json({
      reply: `I'm sorry, I didn't quite understand that. 😅 I can search titles, recommend genres, or explain plans. 

Try asking:
*   *"Show action recommendations"*
*   *"What is the rating of Tears of Steel?"*
*   *"How much is the VIP Platinum plan?"*`
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ reply: "Oops! I encountered an error processing your query." });
  }
};

module.exports = {
  handleChatbotQuery
};
