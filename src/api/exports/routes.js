const routes = (handler) => [
  {
    method: 'POST',
    path: '/export/playlists/{id}',
    handler: handler.postExportPlaylistsHandler,
    options: {
      auth: 'musikprojectdua_jwt',
    },
  },
];

module.exports = routes;
