const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModel } = require('../../utils/song');

class PlaylistSongsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addSongsToPlaylist({ id: playlistId, songId }) {
    const id = `playlistsongs-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal ditambahkan ke Playlist');
    }
    await this._cacheService.delete(`playlist_songs:${playlistId}`);
    return result.rows[0].id;
  }

  // async getSongsFromPlaylist(playlistId) {
  //   const query = {
  //     text: `SELECT songs.id, songs.title, songs.performer FROM playlist_songs
  //         INNER JOIN songs ON playlist_songs.song_id = songs.id
  //         WHERE playlist_songs.playlist_id = $1`,
  //     values: [playlistId],
  //   };
  //   const result = await this._pool.query(query);
  //   return result.rows;
  // }

  async getSongsFromPlaylist(playlistId) {
    try {
      const result = await this._cacheService.get(`playlist_songs:${playlistId}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: `SELECT songs.id, songs.title, songs.performer FROM playlist_songs
              INNER JOIN songs ON playlist_songs.song_id = songs.id
              WHERE playlist_songs.playlist_id = $1`,
        values: [playlistId],
      };
      const result = await this._pool.query(query);
      if (!result.rows.length) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }
      const mapp = result.rows.map(mapDBToModel);
      await this._cacheService.set(`playlistsongs:${playlistId}`, JSON.stringify(mapp));
      return mapp;
    }
  }

  async deleteSongFromPlaylistById(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus pada Playlist');
    }
    await this._cacheService.delete(`playlistsongs:${songId}`);
  }

  async verifySongExist(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
  }
}

module.exports = PlaylistSongsService;
