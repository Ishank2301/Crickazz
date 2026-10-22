import React, { useState, useEffect } from 'react';
import { 
  executeSql, 
  createPlayer, 
  updatePlayer, 
  deletePlayer, 
  createMatch, 
  deleteMatch, 
  getDatabase 
} from '../services/db';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Layers,
  Calendar,
  UserPlus
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface PlayerRow {
  player_id: number;
  full_name: string;
  country: string;
  playing_role: string;
  batting_style: string;
  bowling_style: string;
  date_of_birth: string;
}

interface MatchRow {
  match_id: number;
  match_description: string;
  format: string;
  match_date: string;
  team1: string;
  team2: string;
  winning_team: string;
  victory_margin: number;
  victory_type: string;
}

export const CrudAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'players' | 'matches'>('players');
  const [playersList, setPlayersList] = useState<PlayerRow[]>([]);
  const [matchesList, setMatchesList] = useState<MatchRow[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  
  // Notification Toast
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Player Form State
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [playerForm, setPlayerForm] = useState({
    fullName: '',
    country: 'India',
    playingRole: 'Batsman',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    dateOfBirth: '1995-01-01',
  });

  // Match Form State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
  const [matchForm, setMatchForm] = useState({
    matchDescription: '',
    format: 'T20I',
    matchDate: new Date().toISOString().split('T')[0],
    venueId: 1,
    team1: 'India',
    team2: 'Australia',
    tossWinner: 'India',
    tossDecision: 'bat',
    winningTeam: 'India',
    victoryMargin: 15,
    victoryType: 'runs',
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      await getDatabase();
      const pResult = executeSql('SELECT * FROM players ORDER BY player_id DESC;');
      const pRows: PlayerRow[] = pResult.values.map((v) => ({
        player_id: Number(v[0]),
        full_name: String(v[1]),
        country: String(v[2]),
        playing_role: String(v[3]),
        batting_style: String(v[4]),
        bowling_style: String(v[5]),
        date_of_birth: String(v[6]),
      }));
      setPlayersList(pRows);

      const mResult = executeSql('SELECT match_id, match_description, format, match_date, team1, team2, winning_team, victory_margin, victory_type FROM matches ORDER BY match_id DESC;');
      const mRows: MatchRow[] = mResult.values.map((v) => ({
        match_id: Number(v[0]),
        match_description: String(v[1]),
        format: String(v[2]),
        match_date: String(v[3]),
        team1: String(v[4]),
        team2: String(v[5]),
        winning_team: String(v[6]),
        victory_margin: Number(v[7]),
        victory_type: String(v[8]),
      }));
      setMatchesList(mRows);
    } catch (err: any) {
      setFeedback({ message: `Database error: ${err.message}`, type: 'error' });
    }
  };

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Player Handlers
  const handleOpenAddPlayer = () => {
    setEditingPlayerId(null);
    setPlayerForm({
      fullName: '',
      country: 'India',
      playingRole: 'Batsman',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      dateOfBirth: '1998-05-15',
    });
    setIsPlayerModalOpen(true);
  };

  const handleOpenEditPlayer = (p: PlayerRow) => {
    setEditingPlayerId(p.player_id);
    setPlayerForm({
      fullName: p.full_name,
      country: p.country,
      playingRole: p.playing_role,
      battingStyle: p.batting_style,
      bowlingStyle: p.bowling_style,
      dateOfBirth: p.date_of_birth,
    });
    setIsPlayerModalOpen(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.fullName.trim()) {
      notify('Player full name is required', 'error');
      return;
    }

    try {
      if (editingPlayerId) {
        updatePlayer(editingPlayerId, playerForm);
        notify(`Player "${playerForm.fullName}" updated successfully!`);
      } else {
        createPlayer(playerForm);
        notify(`New player "${playerForm.fullName}" registered successfully!`);
      }
      setIsPlayerModalOpen(false);
      refreshData();
      sounds.playClick();
    } catch (err: any) {
      notify(`Failed to save player: ${err.message}`, 'error');
    }
  };

  const handleDeletePlayer = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete player "${name}"? This will also remove their linked score records.`)) {
      try {
        deletePlayer(id);
        notify(`Player "${name}" deleted.`);
        refreshData();
        sounds.playClick();
      } catch (err: any) {
        notify(`Delete error: ${err.message}`, 'error');
      }
    }
  };

  // Match Handlers
  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchForm.matchDescription.trim()) {
      notify('Match description is required', 'error');
      return;
    }

    try {
      createMatch(matchForm);
      notify(`Match "${matchForm.matchDescription}" added successfully!`);
      setIsMatchModalOpen(false);
      refreshData();
      sounds.playClick();
    } catch (err: any) {
      notify(`Failed to create match: ${err.message}`, 'error');
    }
  };

  const handleDeleteMatch = (id: number, desc: string) => {
    if (confirm(`Delete match "${desc}"?`)) {
      try {
        deleteMatch(id);
        notify(`Match record deleted.`);
        refreshData();
        sounds.playClick();
      } catch (err: any) {
        notify(`Delete error: ${err.message}`, 'error');
      }
    }
  };

  const filteredPlayers = playersList.filter((p) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q) || p.playing_role.toLowerCase().includes(q);
  });

  const filteredMatches = matchesList.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return m.match_description.toLowerCase().includes(q) || m.team1.toLowerCase().includes(q) || m.team2.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50">
          <div className={`px-4 py-3 rounded-xl shadow-2xl text-xs font-bold border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500'
              : 'bg-red-950/90 text-red-200 border-red-500'
          }`}>
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Full CRUD Administrative Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cricket Database Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Create, Read, Update, and Delete player records, match outcomes, and scorecards with live relational table synchronization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'players' ? (
              <button
                onClick={handleOpenAddPlayer}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Player</span>
              </button>
            ) : (
              <button
                onClick={() => setIsMatchModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Match</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab & Search Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-800/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('players');
                sounds.playClick();
              }}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'players'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Players Table ({playersList.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('matches');
                sounds.playClick();
              }}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'matches'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Matches Table ({matchesList.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-800 text-xs text-slate-200 placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {activeTab === 'players' ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">ID</th>
                  <th className="py-3 px-4 font-semibold">Full Name</th>
                  <th className="py-3 px-4 font-semibold">Country</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Batting Style</th>
                  <th className="py-3 px-4 font-semibold">Bowling Style</th>
                  <th className="py-3 px-4 font-semibold">DOB</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                {filteredPlayers.map((p) => (
                  <tr key={p.player_id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-500">{p.player_id}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-100">{p.full_name}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{p.country}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {p.playing_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">{p.batting_style}</td>
                    <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">{p.bowling_style}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{p.date_of_birth}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditPlayer(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition"
                          title="Edit Player"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(p.player_id, p.full_name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-red-400 border border-slate-700 hover:border-red-500/50 transition"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">ID</th>
                  <th className="py-3 px-4 font-semibold">Match Description</th>
                  <th className="py-3 px-3 font-semibold">Format</th>
                  <th className="py-3 px-4 font-semibold">Teams</th>
                  <th className="py-3 px-4 font-semibold">Winner</th>
                  <th className="py-3 px-4 font-semibold">Margin</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                {filteredMatches.map((m) => (
                  <tr key={m.match_id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-500">{m.match_id}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-100">{m.match_description}</td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {m.format}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">{m.team1} vs {m.team2}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-emerald-400">{m.winning_team}</td>
                    <td className="py-3 px-4 text-slate-300">{m.victory_margin} {m.victory_type}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{m.match_date}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteMatch(m.match_id, m.match_description)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-red-400 border border-slate-700 transition"
                        title="Delete Match"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Player */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>{editingPlayerId ? 'Edit Player Profile' : 'Add New Player'}</span>
              </h3>
              <button
                onClick={() => setIsPlayerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jasprit Bumrah"
                  value={playerForm.fullName}
                  onChange={(e) => setPlayerForm({ ...playerForm, fullName: e.target.value })}
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Country</label>
                  <select
                    value={playerForm.country}
                    onChange={(e) => setPlayerForm({ ...playerForm, country: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option>India</option>
                    <option>Australia</option>
                    <option>England</option>
                    <option>South Africa</option>
                    <option>Pakistan</option>
                    <option>New Zealand</option>
                    <option>Afghanistan</option>
                    <option>West Indies</option>
                    <option>Sri Lanka</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Playing Role</label>
                  <select
                    value={playerForm.playingRole}
                    onChange={(e) => setPlayerForm({ ...playerForm, playingRole: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option>Batsman</option>
                    <option>Bowler</option>
                    <option>All-rounder</option>
                    <option>Wicket-keeper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Batting Style</label>
                  <select
                    value={playerForm.battingStyle}
                    onChange={(e) => setPlayerForm({ ...playerForm, battingStyle: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option>Right-hand bat</option>
                    <option>Left-hand bat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bowling Style</label>
                  <input
                    type="text"
                    placeholder="e.g. Right-arm fast"
                    value={playerForm.bowlingStyle}
                    onChange={(e) => setPlayerForm({ ...playerForm, bowlingStyle: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={playerForm.dateOfBirth}
                  onChange={(e) => setPlayerForm({ ...playerForm, dateOfBirth: e.target.value })}
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingPlayerId ? 'Save Changes' : 'Create Player'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Match */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Add Completed Cricket Match</span>
              </h3>
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Match Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. India vs Australia, 4th Test at MCG"
                  value={matchForm.matchDescription}
                  onChange={(e) => setMatchForm({ ...matchForm, matchDescription: e.target.value })}
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Format</label>
                  <select
                    value={matchForm.format}
                    onChange={(e) => setMatchForm({ ...matchForm, format: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option>Test</option>
                    <option>ODI</option>
                    <option>T20I</option>
                    <option>T20</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Match Date</label>
                  <input
                    type="date"
                    value={matchForm.matchDate}
                    onChange={(e) => setMatchForm({ ...matchForm, matchDate: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Team 1</label>
                  <input
                    type="text"
                    value={matchForm.team1}
                    onChange={(e) => setMatchForm({ ...matchForm, team1: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Team 2</label>
                  <input
                    type="text"
                    value={matchForm.team2}
                    onChange={(e) => setMatchForm({ ...matchForm, team2: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Winning Team</label>
                  <input
                    type="text"
                    value={matchForm.winningTeam}
                    onChange={(e) => setMatchForm({ ...matchForm, winningTeam: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Margin</label>
                  <input
                    type="number"
                    value={matchForm.victoryMargin}
                    onChange={(e) => setMatchForm({ ...matchForm, victoryMargin: Number(e.target.value) })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type</label>
                  <select
                    value={matchForm.victoryType}
                    onChange={(e) => setMatchForm({ ...matchForm, victoryType: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700"
                  >
                    <option>runs</option>
                    <option>wickets</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMatchModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Insert Match</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
