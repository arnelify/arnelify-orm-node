{
  "targets": [
    {
      "target_name": "arnelify-orm",
      "sources": ["src/src/addon.cpp"],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        "./src/src",
        "/usr/include",
        "/usr/include/jsoncpp/json"
      ],
      "cflags_cc": ["-std=c++2b", "-w"],
      "cflags_cc!": ["-std=gnu++17"],
      "libraries": ["-ljsoncpp -lmysqlclient"],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except"
      ],
    }
  ]
}