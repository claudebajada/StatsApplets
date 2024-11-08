# Importing necessary libraries from Manim
from manim import *
from scipy.stats import f
from scipy.stats import chi2
import random

# Define the class for the animation
class RegressionAnimation(Scene):
    def construct(self):
        # Sample data points (you can replace these with your actual data)
        data_points = [
            (1, 2), (2, 3), (3, 2.5), (4, 4), (5, 5)
        ]

        # Convert data points to Dots
        dots = VGroup(*[Dot(point=[x, y, 0], color=BLUE) for x, y in data_points])

        # Calculating the mean of Y values
        mean_y = sum([p[1] for p in data_points]) / len(data_points)

        # Placeholder function for regression
        def regression_function(x):
            return 1.1 * x + 1  # Simple linear function as an example

        # Draw mean line and regression line
        mean_line = Line(start=[0, mean_y, 0], end=[6, mean_y, 0], color=GREEN)
        regression_line = Line(start=[1, regression_function(1), 0], end=[5, regression_function(5), 0], color=RED)

        # Group all elements
        graph_elements = VGroup(dots, mean_line, regression_line)

        # Shift graph elements down
        graph_elements.shift(DOWN * 3)

        # Add dots and lines to the scene
        self.play(Create(graph_elements))

        # Draw total variation lines
        total_variation_lines = VGroup(*[DashedLine([x, y, 0], [x, mean_y, 0], color=YELLOW) for x, y in data_points]).shift(DOWN * 3)
        self.play(Create(total_variation_lines)) 

        # Animate the equation for SS_tot
        ss_tot_equation = MathTex("SS_{tot} =", "\sum (Y_i - Y_{mean})^2").to_corner(UL)
        self.play(Write(ss_tot_equation))

        # Remove total variation lines
        self.remove(total_variation_lines)        

        # Draw residual lines
        residual_lines = VGroup(*[DashedLine([x, y, 0], [x, regression_function(x), 0], color=ORANGE) for x, y in data_points]).shift(DOWN * 3)
        self.play(Create(residual_lines))
        
        # Animate the equation for SS_res
        ss_res_equation = MathTex("SS_{res} =", "\sum (Y_i - \hat{Y}_i)^2").next_to(ss_tot_equation, DOWN)
        self.play(Write(ss_res_equation))
        
        # Remove total variation lines
        self.remove(residual_lines)
        
        # Draw model lines (SS_mod)
        model_lines = VGroup(*[DashedLine([x, mean_y, 0], [x, regression_function(x), 0], color=PURPLE) for x, _ in data_points]).shift(DOWN * 3)
        self.play(Create(model_lines))

        # Animate the equation for SS_mod
        ss_mod_equation = MathTex("SS_{mod} =", "SS_{tot} - SS_{res}").next_to(ss_res_equation, DOWN)
        self.play(Write(ss_mod_equation))

        # Waiting for a few seconds to observe the scene
        self.wait(3)
        
# Define the class for the F-test visualization
from manim import *

class FTestScene(Scene):
    def construct(self):
        # SS calculations
        ss_calculations = MathTex(
            "SS_{mod}", "&=", "\\sum", "SS_{tot} - SS_{res}", "\\\\",
            "SS_{res}", "&=", "\\sum", "(Y_i - \hat{Y}_i)^2",
            tex_environment="align*"
        ).scale(0.7).to_edge(UP, buff=1)  # Shifted up

        # df terms
        df_terms = MathTex(
            "df_{\\text{model}}", "&=", "\\text{number of parameters} - 1", "\\\\",
            "df_{\\text{error}}", "&=", "\\text{number of observations} - \\text{number of parameters}",
            tex_environment="align*"
        ).scale(0.7).next_to(ss_calculations, DOWN)



        
        # MS equations
        ms_equations = MathTex(
            "MS_{\\text{mod}}", "&=", "\\frac{SS_{\\text{mod}}}{df_{\\text{mod}}}", "\\\\",
            "MS_{\\text{err}}", "&=", "\\frac{SS_{\\text{err}}}{df_{\\text{err}}}",
            tex_environment="align*"
        ).scale(0.7).next_to(df_terms, DOWN)

        # F-test equation
        f_test_eq = MathTex(
            "F", "=", "\\frac{MS_{\\text{mod}}}{MS_{\\text{err}}}"
        ).scale(0.7).next_to(ms_equations, DOWN)

        # Display all calculations
        self.play(Write(ss_calculations))
        self.play(Write(df_terms))
        self.play(Write(ms_equations))
        self.play(Write(f_test_eq))
        self.wait(2)

class FStatisticAnimation(Scene):
    def construct(self):
        # Step 1: Show Normal Distributions
        normal_curve = self.get_normal_curve()
        normal_text = Text("Errors are assumed to be normally distributed", font_size=36).to_edge(UP)
        self.play(Create(normal_curve), Write(normal_text))
        self.wait()

        # Transition to Chi-Squared Distributions
        chi_squared_curve = self.get_chi_squared_curve()
        chi_squared_text = Text("Squaring the errors gives a Chi-Squared Distribution", font_size=36).to_edge(UP)
        self.play(Transform(normal_curve, chi_squared_curve), Transform(normal_text, chi_squared_text))
        self.wait()

        # Clear the screen before next step
        self.clear()

        # Step 2: Show the Formation of the F-Statistic
        ms_model_curve, ms_error_curve = self.get_ms_curves()
        ms_text = Text("MS Model and MS Error (Chi-Squared)", font_size=36).to_edge(UP)
        self.play(Create(ms_model_curve), Create(ms_error_curve), Write(ms_text))
        self.wait()

        # Show the Ratio
        f_ratio = self.get_f_ratio(ms_model_curve, ms_error_curve)
        f_ratio_text = Text("Dividing two chi-squared distributed variables", font_size=36).to_edge(UP)
        self.play(
            ReplacementTransform(ms_model_curve, f_ratio), 
            ReplacementTransform(ms_error_curve, f_ratio),
            Transform(ms_text, f_ratio_text),
        )
        self.wait()

        # Clear the screen before the final step
        # self.clear()
        self.remove(ms_text)
        self.remove(f_ratio_text)

        # Step 3: Final Display of F-Distribution
        f_curve = self.get_f_curve_with_axes()
        f_distribution_text = Text("Gives an F-Distribution", font_size=36).to_edge(UP)
        # self.play(Create(f_curve), Write(f_distribution_text))
        
        
        # self.play(FadeIn(f_distribution_text))
        self.play(

            # ReplacementTransform(f_ratio_text, f_distribution_text),
            # FadeOut(f_ratio_text),
            FadeIn(f_distribution_text),     
            ReplacementTransform(f_ratio , f_curve)

        )
        self.wait()

    def get_normal_curve(self):
        # Create axes
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.5, 0.1],
            x_length=7,
            y_length=4,
            axis_config={"color": WHITE},
        )

        # Normal distribution PDF
        def normal_dist_pdf(x):
            return 1.0 / np.sqrt(2.0 * np.pi) * np.exp(-0.5 * x**2)

        # Create a plot of the normal distribution
        normal_curve = axes.plot(normal_dist_pdf, color=BLUE)
        normal_curve_group = VGroup(axes, normal_curve)

        return normal_curve_group

    def get_chi_squared_curve(self, df=2):
        # Create axes
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 0.5, 0.1],
            x_length=7,
            y_length=4,
            axis_config={"color": WHITE},
        )

        # Chi-squared distribution PDF
        def chi_squared_pdf(x):
            return chi2.pdf(x, df)

        # Create a plot of the Chi-squared distribution
        chi_squared_curve = axes.plot(chi_squared_pdf, color=RED, x_range=[0.01, 10])
        chi_squared_curve_group = VGroup(axes, chi_squared_curve)

        return chi_squared_curve_group


    def get_ms_curves(self):
        # Assuming df_model and df_error are available or defined elsewhere in the class
        df_model = 2  # Change these values based on your specific scenario
        df_error = 10

        # Create MS_model and MS_error curves
        ms_model_curve = self.get_chi_squared_curve(df=df_model).scale(0.5).to_edge(LEFT, buff=1)
        ms_error_curve = self.get_chi_squared_curve(df=df_error).scale(0.5).to_edge(RIGHT, buff=1)

        return ms_model_curve, ms_error_curve

    def get_f_ratio(self, ms_model_curve, ms_error_curve):
        # Position the MS curves at the top and bottom with horizontal shifts
        ms_model_curve.to_edge(UP).shift(RIGHT * 2).shift(DOWN * 1)
        ms_error_curve.to_edge(DOWN).shift(LEFT * 2).shift(UP * 1)

        # Creating text to indicate the ratio
        ratio_text = MathTex(
            "\\frac{MS_{\\text{model}}}{MS_{\\text{error}}}"
        ).scale(0.7).next_to(ms_model_curve, RIGHT, buff=0.5)

        # Creating the division line to represent the ratio visually
        division_line_start = RIGHT * config.frame_height / 2  # Top of the screen
        division_line_end = LEFT * config.frame_height / 2  # Bottom of the screen
        division_line = Line(division_line_start, division_line_end, color=WHITE)

        # Adjust the horizontal position of the line as needed
        division_line.move_to(ORIGIN)

        # Grouping all components
        f_ratio_group = VGroup(ms_model_curve, ms_error_curve, ratio_text, division_line)
      
        # Shift the entire group down slightly
        f_ratio_group.shift(DOWN * 0.5)  # Adjust the value as needed

        return f_ratio_group


    def get_f_curve(self):
        # Assuming degrees of freedom for model and error to create an F-distribution curve
        dfn, dfd = 2, 10  # Example degrees of freedom
        local_scale_factor = 1  # Define a local scale factor

        # Generating x and y values for the F-distribution
        x_values = np.linspace(0, 5, 100)
        y_values = f.pdf(x_values, dfn, dfd)

        # Creating the F-distribution curve using the generated values
        f_curve = self.get_graph(
            lambda x: local_scale_factor * f.pdf(x, dfn, dfd),
            x_min=0,
            x_max=5,
            color=BLUE
        )

        # Adjusting the position of the curve
        f_curve.to_edge(DOWN)

        return f_curve

    # Helper function to scale the y-values
    def get_graph(self, function, x_min, x_max, **kwargs):
        return ParametricFunction(
            lambda t: np.array([t, function(t), 0]),
            t_range=[x_min, x_max],
            **kwargs
        )
        
    def get_f_curve_with_axes(self):
        # Create axes for F-distribution curve
        axes = Axes(
            x_range=[0, 5, 1],
            y_range=[0, 1, 0.2],
            x_length=7,
            y_length=4,
            axis_config={"color": WHITE},
        )

        # Assuming degrees of freedom for model and error to create an F-distribution curve
        dfn, dfd = 2, 10  # Example degrees of freedom

        # Create the F-distribution curve
        f_curve = axes.plot(lambda x: f.pdf(x, dfn, dfd), x_range=[0, 5], color=BLUE)

        # Group axes and curve for proper alignment
        f_curve_group = VGroup(axes, f_curve).move_to(ORIGIN)

        return f_curve_group

            
# Define the class for the ANOVA visualization
class ANOVAComparison(Scene):
    def construct(self):
        # Sample data points for different groups with jittering
        group_data = {
            "Group 1": [(1 + -0.1, 2), (1, 2.5), (1 + 0.1, 3)],
            "Group 2": [(2 + -0.1, 3), (2, 3.5), (2 + 0.1, 4)],
            "Group 3": [(3 + -0.1, 4), (3, 4.5), (3 + 0.1, 5)]
        }

        # Creating the ANOVA equations on the left
        ss_between_equation = MathTex("SS_{between} = \sum n_i(\\overline{Y}_{i} - \\overline{Y})^2").to_edge(LEFT)
        ss_within_equation = MathTex("SS_{within} = \sum (Y_{ij} - \\overline{Y}_{i})^2").next_to(ss_between_equation, DOWN, aligned_edge=LEFT)
        ss_total_equation = MathTex("SS_{total} = SS_{between} + SS_{within}").next_to(ss_within_equation, DOWN, aligned_edge=LEFT) 
 
        # Create Dots for different groups with jitter
        dots_group = VGroup()
        for group in group_data.values():
            for x, y in group:
                dots_group.add(Dot(point=[x, y, 0], color=BLUE))

        # Shift the dots down before animating
        dots_group.shift(2 * DOWN)

        # Creating a scatter plot for each group
        self.play(Create(dots_group))

        # Correct mean lines - should be centered around the group
        mean_lines = VGroup()
        for x_value, group in enumerate(group_data.values(), start=1):
            mean_y = sum([y for _, y in group]) / len(group)
            mean_line = Line(
                start=[x_value - 0.3, mean_y, 0],  # Centered around the group
                end=[x_value + 0.3, mean_y, 0],  # Centered around the group
                color=PURPLE
            ).shift(2 * DOWN)
            mean_lines.add(mean_line)

        # Group mean label to the left of the diagram
        group_mean_label = Text("Group means", font_size=24).next_to(mean_lines, LEFT)       

        # Correct error lines - should be vertical
        error_lines_to_group_mean = VGroup()
        for x_value, group in enumerate(group_data.values(), start=1):
            mean_y = sum([y for _, y in group]) / len(group)
            for x, y in group:
                error_line = DashedLine(
                    start=[x, mean_y, 0],
                    end=[x, y, 0],
                    color=RED
                ).shift(2 * DOWN)
                error_lines_to_group_mean.add(error_line)

        # Animate the creation of mean lines and labels
        self.play(Create(mean_lines), Write(group_mean_label))

        # Waiting for a few seconds to observe the scene
        self.wait(3)         
        
        self.play(Write(ss_within_equation))
        
        for line in error_lines_to_group_mean:
            self.play(Create(line), run_time=0.3)  # Draw each line individually

        # Waiting for a few seconds to observe the scene
        self.wait(3)  
        
        # Remove the group mean lines and group mean error lines and equation
        self.play(FadeOut(error_lines_to_group_mean), FadeOut(group_mean_label), FadeOut(ss_within_equation))

        # Creating the overall mean line (representing the grand mean)
        overall_mean_y = sum([y for group in group_data.values() for _, y in group]) / sum([len(group) for group in group_data.values()])
        overall_mean_line = Line(
            start=[0.5, overall_mean_y, 0],
            end=[3.5, overall_mean_y, 0],
            color=ORANGE
        ).shift(2 * DOWN)
        grand_mean_label = Text("Grand mean", font_size=24).next_to(overall_mean_line, LEFT)
        
        # animate grand mean
        self.play(Create(overall_mean_line), Write(grand_mean_label))

        # Waiting for a few seconds to observe the scene
        self.wait(3) 

        self.play(Write(ss_between_equation))

        # Draw error lines from each data point to the grand mean, one by one
        error_lines_to_grand_mean = VGroup()  # Initialize a group for the grand mean error lines
        for group in group_data.values():
            for x, y in group:
                error_line = DashedLine(
                    start=[x, overall_mean_y, 0],
                    end=[x, y, 0],
                    color=GREEN
                ).shift(2 * DOWN)
                error_lines_to_grand_mean.add(error_line)  # Add each line to the group
                self.play(Create(error_line), run_time=0.3)  # Draw each line individually

        # Waiting for a few seconds to observe the scene
        self.wait(3) 

        # Remove the overall mean line, grand mean error lines, and associated labels and equation
        self.play(
            FadeOut(error_lines_to_grand_mean),  # Fade out the group of grand mean error lines
            FadeOut(grand_mean_label), 
            FadeOut(ss_between_equation)
        )

        self.play(Write(ss_total_equation))

        # Draw SStot lines (from grand mean to group means)
        sstot_lines = VGroup()
        for group in group_data.values():
            mean_y = sum([y for _, y in group]) / len(group)
            for x, y in group:
                sstot_line = DashedLine(
                    start=[x, overall_mean_y, 0],
                    end=[x, mean_y, 0],
                    color=YELLOW
                ).shift(2 * DOWN)
                error_lines_to_grand_mean.add(sstot_line)  # Add each line to the group
                self.play(Create(sstot_line), run_time=0.3)  # Draw each line individually        
        


        # Waiting for a few seconds to observe the scene
        self.wait(3) 

# Shared data points for both scenes
data_points = [
    (1, 2), (2, 3), (3, 2.5), (4, 4), (5, 5)
]


