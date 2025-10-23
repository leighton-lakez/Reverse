import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RotateCcw, Users, Copy, Share2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReverseIcon } from "@/components/ReverseIcon";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useUnoSounds } from "@/hooks/use-uno-sounds";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type CardColor = "red" | "blue" | "green" | "yellow" | "wild";
type CardValue = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "skip" | "reverse" | "draw2" | "wild" | "wild4";

interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

const UnoGame = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('room');
  const sounds = useUnoSounds();

  const [playerHand, setPlayerHand] = useState<UnoCard[]>([]);
  const [botHand, setBotHand] = useState<UnoCard[]>([]);
  const [opponentHand, setOpponentHand] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [currentColor, setCurrentColor] = useState<CardColor>("red");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string>("");
  const [isReversed, setIsReversed] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [sendingInvites, setSendingInvites] = useState<Set<string>>(new Set());

  // Multiplayer state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [gameRoom, setGameRoom] = useState<any>(null);
  const [opponentProfile, setOpponentProfile] = useState<any>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

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
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (roomCode) {
          toast({
            title: "Sign in required",
            description: "Please sign in to join multiplayer games",
            variant: "destructive",
          });
          navigate("/auth");
        }
        return;
      }

      const userId = session.user.id;
      setCurrentUserId(userId);
      await fetchFriends(userId);

      if (roomCode) {
        // Multiplayer mode
        setIsMultiplayer(true);
        await joinGameRoom(roomCode, userId);
      } else {
        // Single player mode against bot
        setIsMultiplayer(false);
        startGame();
      }
    };

    init();
  }, [roomCode]);

  // Real-time subscription for multiplayer
  useEffect(() => {
    if (!isMultiplayer || !roomCode) return;

    const channel = supabase
      .channel(`game-room-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'uno_game_rooms',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          console.log('Game room updated:', payload);
          if (payload.new) {
            handleGameRoomUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMultiplayer, roomCode]);

  const joinGameRoom = async (code: string, userId: string) => {
    try {
      const { data: room, error } = await supabase
        .from('uno_game_rooms')
        .select('*')
        .eq('room_code', code)
        .single();

      if (error) {
        console.error('Error fetching game room:', error);
        console.error('Room code attempted:', code);
        toast({
          title: "Unable to Join Game",
          description: "Could not find this game room. Please try again or play against the bot!",
          variant: "destructive",
        });
        navigate('/uno');
        return;
      }

      if (!room) {
        toast({
          title: "Room Not Found",
          description: "This game room doesn't exist",
          variant: "destructive",
        });
        navigate('/uno');
        return;
      }

      setGameRoom(room);

      // Fetch opponent profile
      const opponentId = room.host_id === userId ? room.guest_id : room.host_id;
      if (opponentId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', opponentId)
          .single();

        setOpponentProfile(profile);
      }

      // If game hasn't started yet, initialize it
      if (room.status === 'waiting' && room.host_id === userId) {
        setWaitingForOpponent(true);
        await initializeMultiplayerGame(room);
      } else if (room.status === 'waiting') {
        // Guest joined - wait for host to initialize, then start
        setWaitingForOpponent(true);
        // Don't call startMultiplayerGame here - wait for the host to initialize first
      } else if (room.status === 'playing') {
        // Load existing game state
        loadGameState(room.game_state, userId, room);
      }
    } catch (error: any) {
      console.error('Join room error:', error);
      toast({
        title: "Error",
        description: "Failed to join game room",
        variant: "destructive",
      });
    }
  };

  const initializeMultiplayerGame = async (room: any) => {
    const deck = createDeck();
    const hostCards = deck.splice(0, 7);
    const guestCards = deck.splice(0, 7);
    const firstCard = deck.pop()!;

    const gameState = {
      deck: deck,
      playerHands: {
        [room.host_id]: hostCards,
        [room.guest_id]: guestCards
      },
      discardPile: [firstCard],
      currentColor: firstCard.color === "wild" ? "red" : firstCard.color,
      currentTurn: room.host_id,
      isReversed: false
    };

    // Update game state and set status to playing
    await supabase
      .from('uno_game_rooms')
      .update({
        game_state: gameState,
        status: 'playing'
      })
      .eq('id', room.id);

    // Load the game state for the host
    setWaitingForOpponent(false);
    loadGameState(gameState, currentUserId, room);
  };

  const startMultiplayerGame = async (room: any) => {
    setWaitingForOpponent(false);

    await supabase
      .from('uno_game_rooms')
      .update({ status: 'playing' })
      .eq('id', room.id);

    loadGameState(room.game_state, undefined, room);
  };

  const loadGameState = (gameState: any, userId?: string, room?: any) => {
    const playerId = userId || currentUserId;
    const currentRoom = room || gameRoom;

    if (!currentRoom) {
      console.error('Cannot load game state: room is null');
      return;
    }

    setPlayerHand(gameState.playerHands[playerId] || []);
    const opponentId = currentRoom.host_id === playerId ? currentRoom.guest_id : currentRoom.host_id;
    setOpponentHand(gameState.playerHands[opponentId] || []);
    setDiscardPile(gameState.discardPile || []);
    setCurrentColor(gameState.currentColor || 'red');
    setIsPlayerTurn(gameState.currentTurn === playerId);
    setIsReversed(gameState.isReversed || false);
  };

  const handleGameRoomUpdate = (room: any) => {
    setGameRoom(room);

    if (room.status === 'playing' && waitingForOpponent) {
      setWaitingForOpponent(false);
      loadGameState(room.game_state, undefined, room);
    } else if (room.status === 'playing') {
      loadGameState(room.game_state, undefined, room);
    } else if (room.status === 'finished') {
      setGameOver(true);
      if (room.winner_id === currentUserId) {
        sounds.playWin();
        setWinner("You");
      } else {
        sounds.playLose();
        setWinner(opponentProfile?.display_name || "Opponent");
      }
    }
  };

  const fetchFriends = async (userId: string) => {
    // Get users that current user follows
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (!following || following.length === 0) {
      setFriends([]);
      return;
    }

    const followingIds = following.map(f => f.following_id);

    // Get users that follow current user back (mutual follows = friends)
    const { data: mutualFollows } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId)
      .in("follower_id", followingIds);

    if (!mutualFollows || mutualFollows.length === 0) {
      setFriends([]);
      return;
    }

    const friendIds = mutualFollows.map(f => f.follower_id);

    // Fetch friend profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", friendIds);

    setFriends(profiles || []);
  };

  const sendInviteToFriend = async (friendId: string, friendName: string) => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "Please sign in to send invites",
        variant: "destructive",
      });
      return;
    }

    setSendingInvites(prev => new Set(prev).add(friendId));

    try {
      // Generate a unique room code
      const roomCode = `UNO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create a new game room
      const { data: room, error: roomError } = await supabase
        .from("uno_game_rooms")
        .insert({
          room_code: roomCode,
          host_id: currentUserId,
          guest_id: friendId,
          status: 'waiting',
          game_state: {
            deck: [],
            playerHands: {},
            discardPile: [],
            currentColor: 'red',
            currentTurn: currentUserId,
            isReversed: false
          }
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Send a message invite with the room code
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: friendId,
          content: `🎮 Hey! Let's play UNO together! Join my game room: ${window.location.origin}/uno?room=${roomCode}`,
          read: false,
        });

      if (error) throw error;

      toast({
        title: "Game Room Created! 🎮",
        description: `${friendName} will receive your invite. Waiting for them to join...`,
      });

      // Close modal and navigate to the game room
      setInviteModalOpen(false);
      window.location.href = `/uno?room=${roomCode}`;
    } catch (error: any) {
      console.error('Invite error:', error);
      toast({
        title: "Error",
        description: "Failed to create game room",
        variant: "destructive",
      });
    } finally {
      setSendingInvites(prev => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  useEffect(() => {
    // Only run bot AI in single-player mode
    if (!isMultiplayer && !isPlayerTurn && !gameOver) {
      setTimeout(() => {
        botPlay();
      }, 1000);
    }
  }, [isPlayerTurn, gameOver, isMultiplayer]);

  const canPlayCard = (card: UnoCard): boolean => {
    const topCard = discardPile[discardPile.length - 1];
    if (card.color === "wild") return true;
    return card.color === currentColor || card.value === topCard.value;
  };

  const playCard = async (card: UnoCard, chosenColor?: CardColor) => {
    const newPlayerHand = playerHand.filter((c) => c.id !== card.id);
    const newDiscardPile = [...discardPile, card];
    const newColor = card.color === "wild" ? (chosenColor || "red") : card.color;

    // Play sound effect based on card type
    if (card.color === "wild") {
      sounds.playWild();
    } else if (card.value === "skip") {
      sounds.playSkip();
    } else if (card.value === "reverse") {
      sounds.playReverse();
    } else if (card.value === "draw2") {
      sounds.playDraw2();
    } else if (card.value === "wild4") {
      sounds.playWild();
      setTimeout(() => sounds.playDraw2(), 200);
    } else {
      sounds.playCardPlace();
    }

    if (isMultiplayer && gameRoom) {
      // Multiplayer: Update local state immediately for responsive UI
      setPlayerHand(newPlayerHand);
      setDiscardPile(newDiscardPile);
      setCurrentColor(newColor);
      setIsPlayerTurn(false);

      if (card.value === "reverse") {
        setIsReversed(!isReversed);
      }

      // Then update database to sync with opponent
      const opponentId = gameRoom.host_id === currentUserId ? gameRoom.guest_id : gameRoom.host_id;
      const gameState = {
        ...gameRoom.game_state,
        playerHands: {
          ...gameRoom.game_state.playerHands,
          [currentUserId]: newPlayerHand
        },
        discardPile: newDiscardPile,
        currentColor: newColor,
        currentTurn: opponentId,
        isReversed: card.value === "reverse" ? !gameRoom.game_state.isReversed : gameRoom.game_state.isReversed
      };

      // Check for winner
      if (newPlayerHand.length === 0) {
        sounds.playWin();
        setGameOver(true);
        setWinner("You");
        await supabase
          .from('uno_game_rooms')
          .update({
            game_state: gameState,
            status: 'finished',
            winner_id: currentUserId
          })
          .eq('id', gameRoom.id);
        return;
      }

      await supabase
        .from('uno_game_rooms')
        .update({ game_state: gameState })
        .eq('id', gameRoom.id);

      // Show toast for special cards
      if (card.value === "skip") {
        toast({ title: "⏭️ Skip!", description: "Opponent's turn skipped!" });
      } else if (card.value === "reverse") {
        toast({ title: "🔄 Reverse!", description: "Direction reversed!" });
      } else if (card.value === "draw2") {
        toast({ title: "➕ Draw 2!", description: "Opponent draws 2 cards!" });
      } else if (card.value === "wild4") {
        toast({ title: "➕ Wild Draw 4!", description: "Opponent draws 4 cards!" });
      }
    } else {
      // Single player: Local state updates
      setDiscardPile(newDiscardPile);
      setPlayerHand(newPlayerHand);
      setCurrentColor(newColor);

      // Handle special cards for bot
      if (card.value === "reverse") {
        setIsReversed(!isReversed);
        toast({ title: "🔄 Reverse!", description: "Direction reversed!" });
      } else if (card.value === "skip") {
        toast({ title: "⏭️ Skip!", description: "Bot's turn skipped!" });
        return; // Player gets another turn
      } else if (card.value === "draw2") {
        drawCards(botHand, setBotHand, 2);
        toast({ title: "➕ Draw 2!", description: "Bot draws 2 cards!" });
        return;
      } else if (card.value === "wild4") {
        drawCards(botHand, setBotHand, 4);
        toast({ title: "➕ Wild Draw 4!", description: "Bot draws 4 cards!" });
        return;
      }

      if (newPlayerHand.length === 0) {
        checkWinner("Player");
        return;
      }

      setIsPlayerTurn(false);
    }
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

  const drawCard = async () => {
    sounds.playCardDraw();

    const newCard: UnoCard = {
      id: `${Date.now()}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      value: values[Math.floor(Math.random() * values.length)],
    };

    const newPlayerHand = [...playerHand, newCard];

    if (isMultiplayer && gameRoom) {
      // Update local state immediately
      setPlayerHand(newPlayerHand);
      setIsPlayerTurn(false);

      // Update database
      const opponentId = gameRoom.host_id === currentUserId ? gameRoom.guest_id : gameRoom.host_id;
      const gameState = {
        ...gameRoom.game_state,
        playerHands: {
          ...gameRoom.game_state.playerHands,
          [currentUserId]: newPlayerHand
        },
        currentTurn: opponentId
      };

      await supabase
        .from('uno_game_rooms')
        .update({ game_state: gameState })
        .eq('id', gameRoom.id);
    } else {
      // Single player
      setPlayerHand(newPlayerHand);
      setIsPlayerTurn(false);
    }
  };

  const botPlay = () => {
    const playableCards = botHand.filter(canPlayCard);

    if (playableCards.length > 0) {
      const card = playableCards[0];
      const newBotHand = botHand.filter((c) => c.id !== card.id);
      setBotHand(newBotHand);
      setDiscardPile([...discardPile, card]);

      if (card.color === "wild") {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setCurrentColor(randomColor);
      } else {
        setCurrentColor(card.color);
      }

      // Check win condition
      if (newBotHand.length === 0) {
        checkWinner("Bot");
        return;
      }

      // Handle special cards
      if (card.value === "reverse") {
        setIsReversed(!isReversed);
        toast({
          title: "🔄 Bot played Reverse!",
          description: "Direction reversed!",
        });
        setIsPlayerTurn(true);
      } else if (card.value === "skip") {
        toast({
          title: "⏭️ Bot played Skip!",
          description: "Your turn skipped! Bot plays again.",
        });
        // Bot gets another turn - briefly set to true then back to false to trigger useEffect
        setIsPlayerTurn(true);
        setTimeout(() => {
          setIsPlayerTurn(false);
        }, 1500);
        return;
      } else if (card.value === "draw2") {
        drawCards(playerHand, setPlayerHand, 2);
        toast({
          title: "➕ Bot played Draw 2!",
          description: "You draw 2 cards!",
        });
        setIsPlayerTurn(true);
      } else if (card.value === "wild4") {
        drawCards(playerHand, setPlayerHand, 4);
        toast({
          title: "➕ Bot played Wild Draw 4!",
          description: "You draw 4 cards!",
        });
        setIsPlayerTurn(true);
      } else {
        setIsPlayerTurn(true);
      }
    } else {
      drawCards(botHand, setBotHand, 1);
      setIsPlayerTurn(true);
    }
  };

  const checkWinner = (player: string) => {
    setGameOver(true);
    setWinner(player);

    if (player === "Player" || player === "You") {
      sounds.playWin();
      toast({
        title: "🎉 You Won!",
        description: "Congratulations!",
      });
    } else {
      sounds.playLose();
      toast({
        title: "🤖 " + player + " Wins!",
        description: "Better luck next time!",
      });
    }
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
      {/* Realistic felt table texture with vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%),
          repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.03) 3px),
          repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.03) 3px)
        `,
        backgroundSize: '100% 100%, 4px 4px, 4px 4px'
      }} />

      {/* Ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-200/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-200/3 rounded-full blur-[120px] pointer-events-none" />

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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInviteModalOpen(true)}
                className="hover:bg-muted h-12 w-12"
                title="Invite Friends"
              >
                <Users className="h-7 w-7" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={startGame}
                className="hover:bg-muted h-12 w-12"
                title="Restart Game"
              >
                <RotateCcw className="h-7 w-7" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Waiting for opponent overlay */}
        {waitingForOpponent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card border border-primary/30 rounded-2xl p-8 max-w-md text-center">
              <div className="h-16 w-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Waiting for {opponentProfile?.display_name || 'opponent'}...</h2>
              <p className="text-sm text-muted-foreground">They will join shortly</p>
            </div>
          </div>
        )}

        {/* Opponent/Bot Hand */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20">
              <p className="text-sm font-semibold text-white">
                {isMultiplayer
                  ? `${opponentProfile?.display_name || 'Opponent'}: ${opponentHand.length} cards`
                  : `Bot: ${botHand.length} cards`}
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-1 flex-wrap" style={{ perspective: '1000px' }}>
            {(isMultiplayer ? opponentHand : botHand).map((card, index) => {
              const rotation = (index - botHand.length / 2) * 2.5;
              const yOffset = Math.abs(index - botHand.length / 2) * 3;
              return (
                <div
                  key={card.id}
                  className="w-24 h-36 relative transition-all duration-300"
                  style={{
                    transform: `rotateZ(${rotation}deg) translateY(${yOffset}px) rotateX(-5deg)`,
                    zIndex: botHand.length - Math.abs(index - botHand.length / 2),
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Multiple shadow layers for depth */}
                  <div className="absolute inset-0 bg-black/60 rounded-[18px] blur-2xl transform translate-y-6" />
                  <div className="absolute inset-0 bg-black/40 rounded-[18px] blur-lg transform translate-y-4" />
                  <div className="absolute inset-0 bg-black/20 rounded-[18px] blur-md transform translate-y-2" />

                  {/* Card back with realistic design */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-black rounded-[18px] border-[5px] border-[#333] shadow-[0_8px_32px_rgba(0,0,0,0.8)]" style={{ transformStyle: 'preserve-3d' }}>
                    {/* Inner card design */}
                    <div className="absolute inset-[6px] bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-[14px] shadow-inner">
                      {/* Pattern overlay */}
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)'
                      }} />

                      {/* Yellow border */}
                      <div className="absolute inset-[8px] border-[3px] border-yellow-500/40 rounded-[10px] flex items-center justify-center">
                        {/* UNO logo with glow */}
                        <div className="relative">
                          <div className="text-yellow-400 font-black text-2xl tracking-wider drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">UNO</div>
                          <div className="absolute inset-0 text-yellow-300 font-black text-2xl tracking-wider blur-sm opacity-50">UNO</div>
                        </div>
                      </div>
                    </div>

                    {/* Glossy highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-[14px]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Board */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-8">
            {/* Discard Pile */}
            <div className="relative" style={{ perspective: '1200px' }}>
              <p className="text-xs font-semibold text-center mb-3 text-white/70 drop-shadow-lg">Discard Pile</p>
              {discardPile.length > 0 && (
                <div className="relative w-40 h-60">
                  {/* Stack of cards underneath for depth */}
                  {discardPile.length > 1 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[20px] border-4 border-gray-700 transform translate-y-2 translate-x-1 opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[20px] border-4 border-gray-700 transform translate-y-1 translate-x-0.5 opacity-70" />
                    </>
                  )}

                  {/* Multiple shadow layers for ultra-realistic depth */}
                  <div className="absolute inset-0 bg-black/70 rounded-[20px] blur-3xl transform translate-y-8 scale-95" />
                  <div className="absolute inset-0 bg-black/50 rounded-[20px] blur-2xl transform translate-y-5" />
                  <div className="absolute inset-0 bg-black/30 rounded-[20px] blur-xl transform translate-y-3" />

                  {/* Main card with 3D transform */}
                  <div
                    className={`relative w-full h-full rounded-[20px] border-[7px] transition-all duration-500 hover:scale-105 hover:rotate-2 ${getColorClass(
                      currentColor
                    )}`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: 'rotateX(2deg) rotateY(-2deg)',
                      boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    {/* Glossy highlight */}
                    <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/15 to-transparent rounded-t-[14px] pointer-events-none" />

                    {/* Top corner with shadow */}
                    <div className="absolute top-3 left-3 text-white font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      {discardPile[discardPile.length - 1].value === "skip" ? "⊘" :
                       discardPile[discardPile.length - 1].value === "reverse" ? "⟲" :
                       discardPile[discardPile.length - 1].value === "draw2" ? "+2" :
                       discardPile[discardPile.length - 1].value === "wild" ? "W" :
                       discardPile[discardPile.length - 1].value === "wild4" ? "+4" :
                       discardPile[discardPile.length - 1].value.toUpperCase()}
                    </div>

                    {/* Center large oval with realistic shadow */}
                    <div className="flex-1 flex items-center justify-center absolute inset-0">
                      <div className="relative">
                        {/* Oval shadow */}
                        <div className="absolute inset-0 transform translate-y-2 blur-lg opacity-40">
                          <div className="bg-black/60 rounded-full w-32 h-32" />
                        </div>

                        {/* Main oval */}
                        <div className="relative bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]">
                          <div className={`text-6xl font-black drop-shadow-md ${
                            currentColor === "yellow" ? "text-yellow-600" :
                            currentColor === "red" ? "text-red-600" :
                            currentColor === "blue" ? "text-blue-600" :
                            currentColor === "green" ? "text-green-600" :
                            "bg-gradient-to-br from-red-500 via-blue-500 to-green-500 bg-clip-text text-transparent"
                          }`}>
                            {discardPile[discardPile.length - 1].value === "skip" ? "⊘" :
                             discardPile[discardPile.length - 1].value === "reverse" ? "⟲" :
                             discardPile[discardPile.length - 1].value === "draw2" ? "+2" :
                             discardPile[discardPile.length - 1].value === "wild" ? "W" :
                             discardPile[discardPile.length - 1].value === "wild4" ? "+4" :
                             discardPile[discardPile.length - 1].value.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom corner (rotated) with shadow */}
                    <div className="absolute bottom-3 right-3 text-white font-black text-xl rotate-180 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      {discardPile[discardPile.length - 1].value === "skip" ? "⊘" :
                       discardPile[discardPile.length - 1].value === "reverse" ? "⟲" :
                       discardPile[discardPile.length - 1].value === "draw2" ? "+2" :
                       discardPile[discardPile.length - 1].value === "wild" ? "W" :
                       discardPile[discardPile.length - 1].value === "wild4" ? "+4" :
                       discardPile[discardPile.length - 1].value.toUpperCase()}
                    </div>

                    {/* UNO logo with glow effect */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="relative">
                        <div className="text-white font-black text-sm tracking-widest drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]">UNO</div>
                        <div className="absolute inset-0 text-white font-black text-sm tracking-widest blur-sm opacity-60">UNO</div>
                      </div>
                    </div>

                    {/* Edge lighting */}
                    <div className="absolute inset-0 rounded-[14px] shadow-[inset_0_-2px_8px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(255,255,255,0.1)]" />
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
          <div className="flex justify-center gap-2 flex-wrap" style={{ perspective: '1500px' }}>
            {playerHand.map((card, index) => {
              const rotation = (index - playerHand.length / 2) * 3;
              const yOffset = Math.abs(index - playerHand.length / 2) * 4;
              const canPlay = isPlayerTurn && !gameOver && canPlayCard(card);

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={!isPlayerTurn || gameOver}
                  className={`relative w-32 h-48 transition-all duration-300 ${
                    canPlay
                      ? "hover:scale-110 hover:-translate-y-8 hover:rotate-0 cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  style={{
                    transform: `rotateZ(${rotation}deg) translateY(${yOffset}px) rotateX(5deg)`,
                    zIndex: playerHand.length - Math.abs(index - playerHand.length / 2),
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Multiple layered shadows for depth */}
                  <div className="absolute inset-0 bg-black/70 rounded-[22px] blur-3xl transform translate-y-8 scale-95" />
                  <div className="absolute inset-0 bg-black/50 rounded-[22px] blur-2xl transform translate-y-5" />
                  <div className="absolute inset-0 bg-black/30 rounded-[22px] blur-lg transform translate-y-3" />

                  {/* Card with photorealistic effects */}
                  <div
                    className={`relative w-full h-full rounded-[22px] border-[7px] ${getColorClass(card.color)}`}
                    style={{
                      transformStyle: 'preserve-3d',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)'
                    }}
                  >
                    {/* Glossy reflection */}
                    <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/15 to-transparent rounded-t-[16px] pointer-events-none" />

                    {/* Top corner with drop shadow */}
                    <div className="absolute top-3 left-3 text-white font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      {card.value === "skip" ? "⊘" :
                       card.value === "reverse" ? "⟲" :
                       card.value === "draw2" ? "+2" :
                       card.value === "wild" ? "W" :
                       card.value === "wild4" ? "+4" :
                       card.value.toUpperCase()}
                    </div>

                    {/* Center oval with realistic depth */}
                    <div className="flex-1 flex items-center justify-center absolute inset-0">
                      <div className="relative">
                        {/* Shadow beneath oval */}
                        <div className="absolute inset-0 transform translate-y-3 blur-xl opacity-40">
                          <div className="bg-black/70 rounded-full w-24 h-24" />
                        </div>

                        {/* Main white oval */}
                        <div className="relative bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.1)]">
                          <div className={`text-4xl font-black drop-shadow-md ${
                            card.color === "yellow" ? "text-yellow-600" :
                            card.color === "red" ? "text-red-600" :
                            card.color === "blue" ? "text-blue-600" :
                            card.color === "green" ? "text-green-600" :
                            "bg-gradient-to-br from-red-500 via-blue-500 to-green-500 bg-clip-text text-transparent"
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
                    </div>

                    {/* Bottom corner rotated with shadow */}
                    <div className="absolute bottom-3 right-3 text-white font-black text-xl rotate-180 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      {card.value === "skip" ? "⊘" :
                       card.value === "reverse" ? "⟲" :
                       card.value === "draw2" ? "+2" :
                       card.value === "wild" ? "W" :
                       card.value === "wild4" ? "+4" :
                       card.value.toUpperCase()}
                    </div>

                    {/* UNO logo with glow */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                      <div className="relative">
                        <div className="text-white font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]">UNO</div>
                        <div className="absolute inset-0 text-white font-black text-xs tracking-widest blur-sm opacity-60">UNO</div>
                      </div>
                    </div>

                    {/* Edge lighting and depth */}
                    <div className="absolute inset-0 rounded-[16px] shadow-[inset_0_-3px_10px_rgba(0,0,0,0.25),inset_0_3px_10px_rgba(255,255,255,0.1)]" />

                    {/* Playable card glow effect */}
                    {canPlay && (
                      <div className="absolute inset-0 rounded-[16px] shadow-[0_0_20px_rgba(255,215,0,0.4)] animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Invite Friends Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="bg-gradient-to-b from-card to-card/95 border-primary/20 sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Invite Friends to Play
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {friends.length > 0 ? "Select a friend to send them a UNO invite!" : "Add friends to invite them to play UNO!"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4 overflow-y-auto max-h-[60vh]">
            {friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/50 transition-all"
                  >
                    <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-primary/20">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback className="text-sm font-bold">
                        {friend.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{friend.display_name}</p>
                      <p className="text-xs text-muted-foreground">Friend</p>
                    </div>
                    <Button
                      onClick={() => sendInviteToFriend(friend.id, friend.display_name)}
                      disabled={sendingInvites.has(friend.id)}
                      size="sm"
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                    >
                      {sendingInvites.has(friend.id) ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Invite
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex p-4 rounded-full bg-muted/50 mb-3">
                  <Users className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No Friends Yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  When you and another user follow each other, you'll become friends and can invite them to play!
                </p>
              </div>
            )}

            {/* Info Text */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="text-xs text-blue-600 dark:text-blue-400">
                💡 <span className="font-semibold">Tip:</span> Your friend will receive a message with your UNO invite!
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnoGame;
