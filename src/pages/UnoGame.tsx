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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 pb-24 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-mesh opacity-20 pointer-events-none" />

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
            <div className="px-4 py-2 rounded-full glass border border-border/50">
              <p className="text-sm font-semibold">Bot: {botHand.length} cards</p>
            </div>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {botHand.map((card, index) => (
              <div
                key={card.id}
                className="w-16 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-gray-700 shadow-lg"
                style={{ transform: `rotate(${(index - botHand.length / 2) * 2}deg)` }}
              />
            ))}
          </div>
        </div>

        {/* Game Board */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-8">
            {/* Discard Pile */}
            <div className="relative">
              <p className="text-xs font-semibold text-center mb-2 text-muted-foreground">Discard Pile</p>
              {discardPile.length > 0 && (
                <div
                  className={`w-32 h-48 rounded-xl border-4 shadow-2xl flex items-center justify-center transition-all ${getColorClass(
                    currentColor
                  )}`}
                >
                  <div className="text-white text-4xl font-black">
                    {discardPile[discardPile.length - 1].value.toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="text-center">
              <div className="glass rounded-2xl p-6 border border-border/50 space-y-3">
                <div className={`w-12 h-12 rounded-full mx-auto ${getColorClass(currentColor)}`} />
                <p className="text-sm font-semibold text-muted-foreground">Current Color</p>
                {!gameOver && (
                  <div className={`px-4 py-2 rounded-full ${isPlayerTurn ? "bg-primary/20" : "bg-secondary/20"}`}>
                    <p className="text-sm font-bold">
                      {isPlayerTurn ? "Your Turn" : "Bot's Turn"}
                    </p>
                  </div>
                )}
                {gameOver && (
                  <div className="px-4 py-3 rounded-full bg-gradient-to-r from-primary to-secondary">
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
            <div className="px-4 py-2 rounded-full glass border border-primary/30">
              <p className="text-sm font-semibold">Your Hand: {playerHand.length} cards</p>
            </div>
            {isPlayerTurn && !gameOver && (
              <Button
                onClick={drawCard}
                size="sm"
                className="rounded-full"
              >
                Draw Card
              </Button>
            )}
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {playerHand.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={!isPlayerTurn || gameOver}
                className={`w-24 h-36 rounded-xl border-4 shadow-xl transition-all ${getColorClass(
                  card.color
                )} ${
                  isPlayerTurn && !gameOver && canPlayCard(card)
                    ? "hover:scale-110 hover:-translate-y-4 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
                style={{ transform: `rotate(${(index - playerHand.length / 2) * 1}deg)` }}
              >
                <div className="text-white text-2xl font-black flex items-center justify-center h-full">
                  {card.value.toUpperCase()}
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
