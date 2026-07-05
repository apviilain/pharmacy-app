if(NOT TARGET android::reanimated)
add_library(android::reanimated INTERFACE IMPORTED)
set_target_properties(android::reanimated PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES "/Users/akshaypanchal/Freenace_Projects/AtharvCare/node_modules/react-native-reanimated/android/build/prefab-headers/reanimated"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

