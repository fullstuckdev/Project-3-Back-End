const ClientError = require('../../exceptions/ClientError');

class PlaylistSongsHandler {
  constructor(playlistSongsService, playlistsService, validator) {
    this._playlistSongsService = playlistSongsService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this);
    this.getPlaylistSongsHandler = this.getPlaylistSongsHandler.bind(this);
    this.deletePlaylistSongByIdHandler = this.deletePlaylistSongByIdHandler.bind(this);
  }

  async postPlaylistSongHandler(request, h) {
    try {
      this._validator.validatePlaylistSongPayload(request.payload);
      const { songId } = request.payload;
      const { id } = request.params;
      const { id: credentialId } = request.auth.credentials;

      await this._playlistsService.verifyPlaylistOwner(id, credentialId);
      await this._playlistSongsService.verifySongExist(songId);
      await this._playlistSongsService.addSongsToPlaylist({ id, songId });

      const response = h.response({
        status: 'success',
        message: 'Lagu berhasil ditambahkan pada playlist',
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getPlaylistSongsHandler(request, h) {
    try {
      const { id } = request.params;
      const { id: credentialId } = request.auth.credentials;

      await this._playlistsService.verifyPlaylistOwner(id, credentialId);

      const playlist = await this._playlistsService.getPlaylistById(id);
      playlist.songs = await this._playlistSongsService.getSongsFromPlaylist(
        id,
      );

      return {
        status: 'success',
        data: {
          playlist,
        },
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deletePlaylistSongByIdHandler(request, h) {
    try {
      const { id } = request.params;
      const { songId } = request.payload;
      const { id: credentialId } = request.auth.credentials;

      await this._playlistsService.verifyPlaylistOwner(id, credentialId);
      await this._playlistSongsService.deleteSongFromPlaylistById(id, songId);

      return {
        status: 'success',
        message: 'Lagu berhasil dihapus dari playlist',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = PlaylistSongsHandler;
