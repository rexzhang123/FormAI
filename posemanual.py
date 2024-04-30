import cv2
import mediapipe as mp

def get_pose_coordinates(image_data):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=True, model_complexity=2, enable_segmentation=True, min_detection_confidence=0.5)
    image_rgb = cv2.cvtColor(image_data, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    keypoints = {}
    if results.pose_landmarks:
        for idx, landmark in enumerate(results.pose_landmarks.landmark):
            keypoints[mp_pose.PoseLandmark(idx).name] = (landmark.x, landmark.y)

    # print("Keypoints:", keypoints)
    return keypoints, draw_keypoints_on_image(image_data, keypoints)  # Return keypoints and the original image


def draw_keypoints_on_image(image, keypoints):
    for keypoint, (x, y) in keypoints.items():
        # Convert normalized coordinates to absolute values
        x_abs = int(x * image.shape[1])
        y_abs = int(y * image.shape[0])

        #draw aqua keypoints on the image
        cv2.circle(image, (x_abs, y_abs), 2, (255, 255, 0), -1)

    cv2.imwrite('output_with_dots.jpg', image)
    print("Image with keypoints saved as 'output_with_dots.jpg'.")
    return image


