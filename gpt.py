import openai
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import math

# load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

client = OpenAI(api_key=OPENAI_API_KEY)



def calculate_angle(p1, p2, p3):
    """
    Calculate the angle formed at p2 given normalized coordinates for p1, p2, and p3.
    
    Parameters:
    p1, p2, p3 (dict): dictionaries with 'x' and 'y' keys representing normalized coordinates
    
    Returns:
    float: the angle in degrees at point p2 formed by p1, p2, and p3
    """
    # Vector from p2 to p1
    v1 = (p1['x'] - p2['x'], p1['y'] - p2['y'])
    # Vector from p2 to p3
    v2 = (p3['x'] - p2['x'], p3['y'] - p2['y'])
    
    # Calculate dot product and magnitudes of vectors v1 and v2
    dot_product = v1[0] * v2[0] + v1[1] * v2[1]
    magnitude_v1 = math.sqrt(v1[0]**2 + v1[1]**2)
    magnitude_v2 = math.sqrt(v2[0]**2 + v2[1]**2)
    
    if magnitude_v1 * magnitude_v2 == 0:
        return 0  # Avoid division by zero if any vector is a zero vector
    
    # Calculate cosine of the angle using the dot product and magnitudes
    cosine_angle = dot_product / (magnitude_v1 * magnitude_v2)
    
    # Numerical errors might make cosine slightly out of its valid range
    cosine_angle = max(-1, min(1, cosine_angle))
    
    # Calculate the angle in radians and then convert to degrees
    angle = math.acos(cosine_angle)
    return math.degrees(angle)

def process_keypoints_data(data):
    user_results = {}
    reference_results = {}
    user_frame = data['user'][0]
    reference_frame = data['reference'][0]

    # Limb Angles
    user_results['Left Elbow Angle'] = calculate_angle(user_frame['LEFT_SHOULDER'], user_frame['LEFT_ELBOW'], user_frame['LEFT_WRIST'])
    user_results['Right Elbow Angle'] = calculate_angle(user_frame['RIGHT_SHOULDER'], user_frame['RIGHT_ELBOW'], user_frame['RIGHT_WRIST'])
    reference_results['Left Elbow Angle'] = calculate_angle(reference_frame['LEFT_SHOULDER'], reference_frame['LEFT_ELBOW'], reference_frame['LEFT_WRIST'])
    reference_results['Right Elbow Angle'] = calculate_angle(reference_frame['RIGHT_SHOULDER'], reference_frame['RIGHT_ELBOW'], reference_frame['RIGHT_WRIST'])

    # Wrist Hinge
    user_results['Left Wrist Hinge'] = calculate_angle(user_frame['LEFT_ELBOW'], user_frame['LEFT_WRIST'], user_frame['LEFT_INDEX'])
    user_results['Right Wrist Hinge'] = calculate_angle(user_frame['RIGHT_ELBOW'], user_frame['RIGHT_WRIST'], user_frame['RIGHT_INDEX'])
    reference_results['Left Wrist Hinge'] = calculate_angle(reference_frame['LEFT_ELBOW'], reference_frame['LEFT_WRIST'], reference_frame['LEFT_INDEX'])
    reference_results['Right Wrist Hinge'] = calculate_angle(reference_frame['RIGHT_ELBOW'], reference_frame['RIGHT_WRIST'], reference_frame['RIGHT_INDEX'])

    # Weight Shift (assuming hip center position reflects weight shift)
    user_hip_center = {'x': (user_frame['LEFT_HIP']['x'] + user_frame['RIGHT_HIP']['x']) / 2, 'y': (user_frame['LEFT_HIP']['y'] + user_frame['RIGHT_HIP']['y']) / 2}
    reference_hip_center = {'x': (reference_frame['LEFT_HIP']['x'] + reference_frame['RIGHT_HIP']['x']) / 2, 'y': (reference_frame['LEFT_HIP']['y'] + reference_frame['RIGHT_HIP']['y']) / 2}
    user_results['Weight Shift'] = user_hip_center['x']
    reference_results['Weight Shift'] = reference_hip_center['x']

    # Balance and Stability (comparing distance between ankles as a simple stability measure)
    user_ankle_distance = math.sqrt((user_frame['LEFT_ANKLE']['x'] - user_frame['RIGHT_ANKLE']['x'])**2 + (user_frame['LEFT_ANKLE']['y'] - user_frame['RIGHT_ANKLE']['y'])**2)
    reference_ankle_distance = math.sqrt((reference_frame['LEFT_ANKLE']['x'] - reference_frame['RIGHT_ANKLE']['x'])**2 + (reference_frame['LEFT_ANKLE']['y'] - reference_frame['RIGHT_ANKLE']['y'])**2)
    user_results['Stability'] = user_ankle_distance
    reference_results['Stability'] = reference_ankle_distance

    # New metrics
    # Shoulder Rotation (measured between the two shoulders)
    user_results['Shoulder Rotation'] = calculate_angle({'x': 0, 'y': 0}, user_frame['LEFT_SHOULDER'], user_frame['RIGHT_SHOULDER'])
    reference_results['Shoulder Rotation'] = calculate_angle({'x': 0, 'y': 0}, reference_frame['LEFT_SHOULDER'], reference_frame['RIGHT_SHOULDER'])

    # Hip Rotation
    user_results['Hip Rotation'] = calculate_angle({'x': 0, 'y': 0}, user_frame['LEFT_HIP'], user_frame['RIGHT_HIP'])
    reference_results['Hip Rotation'] = calculate_angle({'x': 0, 'y': 0}, reference_frame['LEFT_HIP'], reference_frame['RIGHT_HIP'])

    # Knee Flexion
    user_results['Left Knee Flexion'] = calculate_angle(user_frame['LEFT_HIP'], user_frame['LEFT_KNEE'], user_frame['LEFT_ANKLE'])
    user_results['Right Knee Flexion'] = calculate_angle(user_frame['RIGHT_HIP'], user_frame['RIGHT_KNEE'], user_frame['RIGHT_ANKLE'])
    reference_results['Left Knee Flexion'] = calculate_angle(reference_frame['LEFT_HIP'], reference_frame['LEFT_KNEE'], reference_frame['LEFT_ANKLE'])
    reference_results['Right Knee Flexion'] = calculate_angle(reference_frame['RIGHT_HIP'], reference_frame['RIGHT_KNEE'], reference_frame['RIGHT_ANKLE'])

    # Torso Alignment (between hip center and shoulder center)
    user_hip_center = {'x': (user_frame['LEFT_HIP']['x'] + user_frame['RIGHT_HIP']['x']) / 2, 'y': (user_frame['LEFT_HIP']['y'] + user_frame['RIGHT_HIP']['y']) / 2}
    user_shoulder_center = {'x': (user_frame['LEFT_SHOULDER']['x'] + user_frame['RIGHT_SHOULDER']['x']) / 2, 'y': (user_frame['LEFT_SHOULDER']['y'] + user_frame['RIGHT_SHOULDER']['y']) / 2}
    reference_hip_center = {'x': (reference_frame['LEFT_HIP']['x'] + reference_frame['RIGHT_HIP']['x']) / 2, 'y': (reference_frame['LEFT_HIP']['y'] + reference_frame['RIGHT_HIP']['y']) / 2}
    reference_shoulder_center = {'x': (reference_frame['LEFT_SHOULDER']['x'] + reference_frame['RIGHT_SHOULDER']['x']) / 2, 'y': (reference_frame['LEFT_SHOULDER']['y'] + reference_frame['RIGHT_SHOULDER']['y']) / 2}
    user_results['Torso Alignment'] = calculate_angle(user_hip_center, {'x': 0.5, 'y': 0.5}, user_shoulder_center)
    reference_results['Torso Alignment'] = calculate_angle(reference_hip_center, {'x': 0.5, 'y': 0.5}, reference_shoulder_center)


    return generate_golf_swing_feedback(user_results, reference_results)



def generate_golf_swing_feedback(user_results, reference_results):
    """
    Generates targeted feedback on a golf swing by comparing user's metrics with a reference's metrics,
    highlighting the top three areas needing improvement.

    Parameters:
    user_results (dict): A dictionary containing metrics for a user's swing frame.
    reference_results (dict): A dictionary containing metrics for a reference's swing frame.

    Returns:
    str: Structured feedback.
    """
    differences = []
    importance = {
        'Left Elbow Angle': 4, 'Right Elbow Angle': 4, 'Left Wrist Hinge': 2, 'Right Wrist Hinge': 2,
        'Weight Shift': 10, 'Stability': 7, 'Shoulder Rotation': 5, 'Hip Rotation': 5, 'Left Knee Flexion': 3, 'Right Knee Flexion': 3,
        'Torso Alignment': 6
    }
    units = {
        'Left Elbow Angle': 'degrees', 'Right Elbow Angle': 'degrees',
        'Left Wrist Hinge': 'degrees', 'Right Wrist Hinge': 'degrees',
        'Weight Shift': 'units', 'Stability': 'units', 'Shoulder Rotation': 'degrees',
        'Hip Rotation': 'degrees', 'Left Knee Flexion': 'degrees', 'Right Knee Flexion': 'degrees',
        'Torso Alignment': 'degrees'
    }

    # Analyze differences and importance for feedback
    for metric, user_value in user_results.items():
        if metric in reference_results:
            ref_value = reference_results[metric]
            diff = abs(user_value - ref_value)
            differences.append((metric, None, user_value, ref_value, diff, importance.get(metric, 1) * diff))

    # Sort differences by the product of importance and difference
    differences.sort(key=lambda x: x[5], reverse=True)  # Sort by weighted importance

    # Construct feedback
    feedback_prompt = "Based on the swing analysis, here are the top three areas needing improvement:\n"
    for metric, frame, user_value, ref_value, diff, _ in differences[:3]:
        unit = units.get(metric, "units")
        frame_info = f" in frame {frame}" if frame is not None else ""
        higher_lower = "higher" if user_value > ref_value else "lower"
        advice_direction = "reduce" if user_value > ref_value else "increase"
        english = "this measurement"  # Placeholder for contextual language improvement
        feedback_prompt += (
            f"**{metric.capitalize()}**{frame_info}: User current value is {user_value:.2f} {unit}, "
            f"which is {higher_lower} than the reference standard of {ref_value:.2f} {unit}. "
            f"Discrepancy: {diff:.2f} {unit}. Please follow the detailed steps on how to improve this metric. Explain to the user how to {advice_direction} the {metric.lower().replace('_', ' ')} {english} "
            f"and the steps to {advice_direction} it:\n"
            "- [Insert specific advice for this metric based on professional guidance]\n"
        )

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a golf coach. Your job is to analyze and provide detailed suggestions to a golfer after comparing their metrics with those of a reference golfer."},
            {"role": "user", "content": feedback_prompt}
        ],
        max_tokens=1000
    )

    # # Return the generated suggestions from the model
    return response.choices[0].message.content
