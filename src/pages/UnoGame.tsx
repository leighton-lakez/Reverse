import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReverseIcon } from "@/components/ReverseIcon";
import { toast } from "@/hooks/use-toast";

type CardColor = "red" | "blue" | "green" | "yellow" | "wild";
type CardValue = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "skip" | "reverse" | "draw2" | "wild" | "wild4";

interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

const UnoGame = () => {
  const navigate = useNavigate();
  const [playerHand, setPlayerHand] = useState<UnoCard[]>([]);
  const [botHand, setBotHand] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [currentColor, setCurrentColor] = useState<CardColor>("red");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string>("");
  const [isReversed, setIsReversed] = useState(false);

  const colors: CardColor[] = ["red", "blue", "green", "yellow"];
  const values: CardValue[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "draw2"];

  const getColorClass = (color: CardColor) => {
    switch (color) {
      case "red":
        return "bg-red-500 border-red-600";
      case "blue":
        return "bg-blue-500 border-blue-600";
      case "green":
        return "bg-green-500 border-green-600";
      case "yellow":
        return "bg-yellow-400 border-yellow-500";
      case "wild":
        return "bg-gradient-to-br from-red-500 via-blue-500 to-green-500 border-purple-600";
    }
  };

  const createDeck = (): UnoCard[] => {
    const deck: UnoCard[] = [];
    let id = 0;

    // Regular cards
    colors.forEach((color) => {
      values.forEach((value) => {
        const count = value === "0" ? 1 : 2;
        for (let i = 0; i < count; i++) {
          deck.push({ id: `${id++}`, color, value });
        }
      });
    });

    // Wild cards
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `${id++}`, color: "wild", value: "wild" });
      deck.push({ id: `${id++}`, color: "wild", value: "wild4" });
    }

    return shuffleDeck(deck);
  };

  const shuffleDeck = (deck: UnoCard[]): UnoCard[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = () => {
    const deck = createDeck();
    const playerCards = deck.splice(0, 7);
    const botCards = deck.splice(0, 7);
    const firstCard = deck.pop()!;

    setPlayerHand(playerCards);
    setBotHand(botCards);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color === "wild" ? "red" : firstCard.color);
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner("");
    setIsReversed(false);
  };

  useEffect(() => {
    startGame();
  }, []);

  useEffect(() => {
    if (!isPlayerTurn && !gameOver) {
      setTimeout(() => {
        botPlay();
      }, 1000);
    }
  }, [isPlayerTurn, gameOver]);

  const canPlayCard = (card: UnoCard): boolean => {
    const topCard = discardPile[discardPile.length - 1];
    if (card.color === "wild") return true;
    return card.color === currentColor || card.value === topCard.value;
  };

  const playCard = (card: UnoCard, chosenColor?: CardColor) => {
    setDiscardPile([...discardPile, card]);
    setPlayerHand(playerHand.filter((c) => c.id !== card.id));

    if (card.color === "wild") {
      setCurrentColor(chosenColor || "red");
    } else {
      setCurrentColor(card.color);
    }

    // Handle special cards
    if (card.value === "reverse") {
      setIsReversed(!isReversed);
      toast({
        title: "🔄 Reverse!",
        description: "Direction reversed!",
      });
    } else if (card.value === "skip") {
      toast({
        title: "⏭️ Skip!",
        description: "Bot's turn skipped!",
      });
      return; // Player gets another turn
    } else if (card.value === "draw2") {
      drawCards(botHand, setBotHand, 2);
      toast({
        title: "➕ Draw 2!",
        description: "Bot draws 2 cards!",
      });
      return;
    } else if (card.value === "wild4") {
      drawCards(botHand, setBotHand, 4);
      toast({
        title: "➕ Wild Draw 4!",
        description: "Bot draws 4 cards!",
      });
      return;
    }

    if (playerHand.length === 1) {
      checkWinner("Player");
      return;
    }

    setIsPlayerTurn(false);
  };

  const drawCards = (hand: UnoCard[], setHand: (cards: UnoCard[]) => void, count: number) => {
    const newCards: UnoCard[] = [];
    for (let i = 0; i < count; i++) {
      newCards.push({
        id: `${Date.now()}-${i}`,
        color: colors[Math.floor(Math.random() * colors.length)],
        value: values[Math.floor(Math.random() * values.length)],
      });
    }
    setHand([...hand, ...newCards]);
  };

  const drawCard = () => {
    drawCards(playerHand, setPlayerHand, 1);
    setIsPlayerTurn(false);
  };

  const botPlay = () => {
    const playableCards = botHand.filter(canPlayCard);

    if (playableCards.length > 0) {
      const card = playableCards[0];
      setBotHand(botHand.filter((c) => c.id !== card.id));
      setDiscardPile([...discardPile, card]);

      if (card.color === "wild") {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setCurrentColor(randomColor);
      } else {
        setCurrentColor(card.color);
      }

      // Handle special cards
      if (card.value === "reverse") {
        setIsReversed(!isReversed);
        toast({
          title: "🔄 Bot played Reverse!",
          description: "Direction reversed!",
        });
      } else if (card.value === "skip") {
        toast({
          title: "⏭️ Bot played Skip!",
          description: "Your turn skipped!",
        });
        setTimeout(() => botPlay(), 1000);
        return;
      } else if (card.value === "draw2") {
        drawCards(playerHand, setPlayerHand, 2);
        toast({
          title: "➕ Bot played Draw 2!",
          description: "You draw 2 cards!",
        });
      } else if (card.value === "wild4") {
        drawCards(playerHand, setPlayerHand, 4);
        toast({
          title: "➕ Bot played Wild Draw 4!",
          description: "You draw 4 cards!",
        });
      }

      if (botHand.length === 1) {
        checkWinner("Bot");
        return;
      }
    } else {
      drawCards(botHand, setBotHand, 1);
    }

    setIsPlayerTurn(true);
  };

  const checkWinner = (player: string) => {
    setGameOver(true);
    setWinner(player);
    toast({
      title: player === "Player" ? "🎉 You Won!" : "🤖 Bot Wins!",
      description: player === "Player" ? "Congratulations!" : "Better luck next time!",
    });
  };

  const handleCardClick = (card: UnoCard) => {
    if (!isPlayerTurn || gameOver) return;

    if (canPlayCard(card)) {
      if (card.color === "wild") {
        // Simple color selection - just pick red for now
        playCard(card, "red");
      } else {
        playCard(card);
      }
    } else {
      toast({
        title: "Invalid Move",
        description: "You can't play that card!",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 pb-24 relative overflow-hidden">
      {/* Felt table texture */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`,
      }} />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <ReverseIcon className="w-8 h-8" />
              <h1 className="text-2xl font-black tracking-tighter text-gradient">UNO REVERSE</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={startGame}
              className="hover:bg-muted"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Bot Hand */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20">
              <p className="text-sm font-semibold text-white">Bot: {botHand.length} cards</p>
            </div>
          </div>
          <div className="flex justify-center gap-1 flex-wrap perspective-1000">
            {botHand.map((card, index) => (
              <div
                key={card.id}
                className="w-20 h-32 relative transform transition-all"
                style={{
                  transform: `rotate(${(index - botHand.length / 2) * 3}deg) translateY(${Math.abs(index - botHand.length / 2) * 2}px)`,
                  zIndex: botHand.length - Math.abs(index - botHand.length / 2)
                }}
              >
                {/* Card back with realistic design */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl border-4 border-gray-700 shadow-2xl">
                  <div className="absolute inset-1 bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-xl">
                    <div className="absolute inset-2 border-2 border-yellow-400/50 rounded-lg flex items-center justify-center">
                      <div className="text-yellow-400 font-black text-xl opacity-50">UNO</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Board */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-8">
            {/* Discard Pile */}
            <div className="relative">
              <p className="text-xs font-semibold text-center mb-2 text-white/70">Discard Pile</p>
              {discardPile.length > 0 && (
                <div className="relative w-36 h-52 perspective-1000">
                  {/* Card shadow/depth effect */}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl blur-xl transform translate-y-2" />

                  {/* Actual card */}
                  <div
                    className={`relative w-full h-full rounded-2xl border-[6px] shadow-2xl flex flex-col transition-all transform hover:scale-105 ${getColorClass(
                      currentColor
                    )}`}
                  >
                    {/* Top corner */}
                    <div className="absolute top-2 left-2 text-white font-black text-lg">
                      {discardPile[discardPile.length - 1].value.toUpperCase()}
                    </div>

                    {/* Center large text */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full w-24 h-24 flex items-center justify-center shadow-lg">
                        <div className={`text-5xl font-black ${
                          currentColor === "yellow" ? "text-yellow-600" :
                          currentColor === "red" ? "text-red-600" :
                          currentColor === "blue" ? "text-blue-600" :
                          currentColor === "green" ? "text-green-600" :
                          "text-purple-600"
                        }`}>
                          {discardPile[discardPile.length - 1].value.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Bottom corner (rotated) */}
                    <div className="absolute bottom-2 right-2 text-white font-black text-lg rotate-180">
                      {discardPile[discardPile.length - 1].value.toUpperCase()}
                    </div>

                    {/* UNO logo at bottom */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                      <div className="text-white font-black text-xs opacity-80">UNO</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="text-center">
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 space-y-3">
                <div className={`w-16 h-16 rounded-full mx-auto border-4 border-white shadow-xl ${getColorClass(currentColor)}`} />
                <p className="text-sm font-semibold text-white/80">Current Color</p>
                {!gameOver && (
                  <div className={`px-4 py-2 rounded-full ${isPlayerTurn ? "bg-yellow-500/80" : "bg-blue-500/80"} shadow-lg`}>
                    <p className="text-sm font-bold text-white">
                      {isPlayerTurn ? "🎮 Your Turn" : "🤖 Bot's Turn"}
                    </p>
                  </div>
                )}
                {gameOver && (
                  <div className="px-4 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 shadow-xl">
                    <p className="text-sm font-black text-white">
                      {winner} Wins! 🎉
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20">
              <p className="text-sm font-semibold text-white">Your Hand: {playerHand.length} cards</p>
            </div>
            {isPlayerTurn && !gameOver && (
              <Button
                onClick={drawCard}
                size="sm"
                className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg"
              >
                🎴 Draw Card
              </Button>
            )}
          </div>
          <div className="flex justify-center gap-2 flex-wrap perspective-1000">
            {playerHand.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={!isPlayerTurn || gameOver}
                className={`relative w-28 h-40 transition-all ${
                  isPlayerTurn && !gameOver && canPlayCard(card)
                    ? "hover:scale-110 hover:-translate-y-6 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
                style={{
                  transform: `rotate(${(index - playerHand.length / 2) * 2}deg) translateY(${Math.abs(index - playerHand.length / 2) * 3}px)`,
                  zIndex: playerHand.length - Math.abs(index - playerHand.length / 2)
                }}
              >
                {/* Card shadow */}
                <div className="absolute inset-0 bg-black/50 rounded-2xl blur-lg transform translate-y-2" />

                {/* Card */}
                <div className={`relative w-full h-full rounded-2xl border-[6px] shadow-2xl flex flex-col ${getColorClass(
                  card.color
                )}`}>
                  {/* Top corner */}
                  <div className="absolute top-2 left-2 text-white font-black text-base">
                    {card.value.toUpperCase()}
                  </div>

                  {/* Center large display */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                      <div className={`text-3xl font-black ${
                        card.color === "yellow" ? "text-yellow-600" :
                        card.color === "red" ? "text-red-600" :
                        card.color === "blue" ? "text-blue-600" :
                        card.color === "green" ? "text-green-600" :
                        "text-purple-600"
                      }`}>
                        {card.value === "skip" ? "⊘" :
                         card.value === "reverse" ? "⟲" :
                         card.value === "draw2" ? "+2" :
                         card.value === "wild" ? "W" :
                         card.value === "wild4" ? "+4" :
                         card.value.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Bottom corner (rotated) */}
                  <div className="absolute bottom-2 right-2 text-white font-black text-base rotate-180">
                    {card.value.toUpperCase()}
                  </div>

                  {/* UNO logo */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="text-white font-black text-[10px] opacity-80">UNO</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnoGame;
