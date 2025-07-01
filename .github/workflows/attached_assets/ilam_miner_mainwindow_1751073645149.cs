<Window x:Class="IlamMinerDetector.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="سیستم شناسایی ماینر استان ایلام" Height="800" Width="1200"
        WindowStartupLocation="CenterScreen" ResizeMode="CanResize"
        Background="#FF2D2D30" Foreground="White">
    
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#FF007ACC"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="BorderBrush" Value="#FF007ACC"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="10,5"/>
            <Setter Property="Margin" Value="5"/>
            <Setter Property="FontFamily" Value="B Nazanin"/>
            <Setter Property="FontSize" Value="14"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Style.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter Property="Background" Value="#FF1BA1E2"/>
                </Trigger>
            </Style.Triggers>
        </Style>
        
        <Style TargetType="TextBox">
            <Setter Property="Background" Value="#FF3F3F46"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="BorderBrush" Value="#FF007ACC"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="5"/>
            <Setter Property="FontFamily" Value="B Nazanin"/>
            <Setter Property="FontSize" Value="12"/>
        </Style>
        
        <Style TargetType="Label">
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="FontFamily" Value="B Nazanin"/>
            <Setter Property="FontSize" Value="12"/>
        </Style>
        
        <Style TargetType="TextBlock">
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="FontFamily" Value="B Nazanin"/>
            <Setter Property="FontSize" Value="12"/>
        </Style>
        
        <Style TargetType="DataGrid">
            <Setter Property="Background" Value="#FF3F3F46"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="GridLinesVisibility" Value="All"/>
            <Setter Property="HeadersVisibility" Value="Column"/>
            <Setter Property="CanUserAddRows" Value="False"/>
            <Setter Property="IsReadOnly" Value="True"/>
            <Setter Property="AutoGenerateColumns" Value="False"/>
            <Setter Property="FontFamily" Value="B Nazanin"/>
            <Setter Property="FontSize" Value="11"/>
        </Style>
        
        <Style TargetType="DataGridColumnHeader">
            <Setter Property="Background" Value="#FF007ACC"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="FontFamily" Value="B Nazanin"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="HorizontalContentAlignment" Value="Center"/>
            <Setter Property="Padding" Value="5"/>
        </Style>
        
        <Style TargetType="ProgressBar">
            <Setter Property="Height" Value="20"/>
            <Setter Property="Background" Value="#FF3F3F46"/>
            <Setter Property="Foreground" Value="#FF007ACC"/>
        </Style>
    </Window.Resources>
    
    <Grid>
        <!-- پس‌زمینه گرادیان شب -->
        <Grid.Background>
            <LinearGradientBrush StartPoint="0,0" EndPoint="0,1">
                <GradientStop Color="#FF0F2027" Offset="0"/>
                <GradientStop Color="#FF2C5364" Offset="1"/>
            </LinearGradientBrush>
        </Grid.Background>

        <!-- نیم‌دایره تور مهتاب -->
        <Ellipse Width="700" Height="350" 
                 HorizontalAlignment="Center" VerticalAlignment="Top"
                 Margin="0,0,0,0"
                 Fill="#33FFFFFF">
            <Ellipse.Effect>
                <BlurEffect Radius="60"/>
            </Ellipse.Effect>
        </Ellipse>

        <!-- ماه -->
        <Ellipse Width="100" Height="100" 
                 HorizontalAlignment="Center" VerticalAlignment="Top"
                 Margin="0,60,0,0"
                 Fill="White">
            <Ellipse.Effect>
                <DropShadowEffect Color="White" BlurRadius="60" ShadowDepth="0"/>
            </Ellipse.Effect>
        </Ellipse>

        <!-- ستاره‌های چشمک‌زن -->
        <Canvas Name="StarCanvas" IsHitTestVisible="False"/>

        <!-- سایر کنترل‌های UI (در Grid داخلی) -->
        <Grid>
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="*"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>
            
            <!-- Header -->
            <Border Grid.Row="0" Background="#FF007ACC" Padding="10">
                <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
                    <TextBlock Text="🏔️" FontSize="24" VerticalAlignment="Center" Margin="0,0,10,0"/>
                    <TextBlock Text="سیستم جامع شناسایی ماینر ارز دیجیتال - استان ایلام" 
                              FontSize="18" FontWeight="Bold" VerticalAlignment="Center"/>
                    <TextBlock Text="🏔️" FontSize="24" VerticalAlignment="Center" Margin="10,0,0,0"/>
                </StackPanel>
            </Border>
            
            <!-- Control Panel -->
            <Border Grid.Row="1" Background="#FF3F3F46" Padding="10" Margin="5">
                <Grid>
                    <Grid.RowDefinitions>
                        <RowDefinition Height="Auto"/>
                        <RowDefinition Height="Auto"/>
                    </Grid.RowDefinitions>
                    
                    <!-- Scan Controls -->
                    <StackPanel Grid.Row="0" Orientation="Horizontal" HorizontalAlignment="Center">
                        <Button Name="BtnStartScan" Content="🚀 شروع اسکن جامع" Click="BtnStartScan_Click"/>
                        <Button Name="BtnStopScan" Content="⏹️ توقف اسکن" Click="BtnStopScan_Click" IsEnabled="False"/>
                        <Button Name="BtnNetworkScan" Content="🌐 اسکن شبکه" Click="BtnNetworkScan_Click"/>
                        <Button Name="BtnPortScan" Content="🔍 اسکن پورت" Click="BtnPortScan_Click"/>
                        <Button Name="BtnGeoLocation" Content="🗺️ مکان‌یابی" Click="BtnGeoLocation_Click"/>
                        <Button Name="BtnExportResults" Content="📊 خروجی گزارش" Click="BtnExportResults_Click"/>
                        <Button Name="BtnShowAllFromDb" Content="📂 مشاهده همه دستگاه‌ها" Click="BtnShowAllFromDb_Click"/>
                    </StackPanel>
                    
                    <!-- IP Range Input -->
                    <StackPanel Grid.Row="1" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,10,0,0">
                        <Label Content="محدوده IP:"/>
                        <TextBox Name="TxtIpRange" Width="150" Text="192.168.1.1-254"/>
                        <Label Content="پورت‌ها:"/>
                        <TextBox Name="TxtPorts" Width="200" Text="4028,4029,8080,3333,9999"/>
                        <Label Content="تایم‌اوت (ثانیه):"/>
                        <TextBox Name="TxtTimeout" Width="50" Text="3"/>
                    </StackPanel>
                </Grid>
            </Border>
            
            <!-- Main Content -->
            <Grid Grid.Row="2" Margin="5">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="2*"/>
                    <ColumnDefinition Width="5"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                
                <!-- Results DataGrid -->
                <Border Grid.Column="0" Background="#FF3F3F46" Padding="5">
                    <Grid>
                        <Grid.RowDefinitions>
                            <RowDefinition Height="Auto"/>
                            <RowDefinition Height="*"/>
                        </Grid.RowDefinitions>
                        
                        <TextBlock Grid.Row="0" Text="📋 نتایج اسکن" FontSize="14" FontWeight="Bold" Margin="5"/>
                        
                        <DataGrid Grid.Row="1" Name="DgResults" Margin="5">
                            <DataGrid.Columns>
                                <DataGridTextColumn Header="آدرس IP" Binding="{Binding IpAddress}" Width="120"/>
                                <DataGridTextColumn Header="MAC Address" Binding="{Binding MacAddress}" Width="140"/>
                                <DataGridTextColumn Header="پورت‌های باز" Binding="{Binding OpenPorts}" Width="100"/>
                                <DataGridTextColumn Header="نوع دستگاه" Binding="{Binding DeviceType}" Width="120"/>
                                <DataGridTextColumn Header="امتیاز شک" Binding="{Binding SuspicionScore}" Width="80"/>
                                <DataGridTextColumn Header="شهر" Binding="{Binding City}" Width="100"/>
                                <DataGridTextColumn Header="وضعیت" Binding="{Binding Status}" Width="80"/>
                                <DataGridTextColumn Header="زمان تشخیص" Binding="{Binding DetectionTime}" Width="140"/>
                            </DataGrid.Columns>
                        </DataGrid>
                    </Grid>
                </Border>
                
                <GridSplitter Grid.Column="1" Width="5" Background="#FF007ACC" HorizontalAlignment="Stretch"/>
                
                <!-- Statistics Panel -->
                <Border Grid.Column="2" Background="#FF3F3F46" Padding="5">
                    <Grid>
                        <Grid.RowDefinitions>
                            <RowDefinition Height="Auto"/>
                            <RowDefinition Height="*"/>
                            <RowDefinition Height="Auto"/>
                        </Grid.RowDefinitions>
                        
                        <TextBlock Grid.Row="0" Text="📊 آمار و وضعیت" FontSize="14" FontWeight="Bold" Margin="5"/>
                        
                        <ScrollViewer Grid.Row="1" VerticalScrollBarVisibility="Auto">
                            <StackPanel Name="PnlStatistics" Margin="5">
                                <!-- Statistics will be added here dynamically -->
                            </StackPanel>
                        </ScrollViewer>
                        
                        <!-- Map Button -->
                        <Button Grid.Row="2" Name="BtnShowMap" Content="🗺️ نمایش نقشه" 
                               Click="BtnShowMap_Click" Margin="5"/>
                    </Grid>
                </Border>
            </Grid>
            
            <!-- Status Bar -->
            <Border Grid.Row="3" Background="#FF007ACC" Padding="5">
                <Grid>
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                        <ColumnDefinition Width="200"/>
                    </Grid.ColumnDefinitions>
                    
                    <TextBlock Grid.Column="0" Name="TxtStatus" Text="آماده برای اسکن..." 
                              VerticalAlignment="Center"/>
                    
                    <TextBlock Grid.Column="1" Name="TxtProgress" Text="0%" 
                              VerticalAlignment="Center" Margin="10,0"/>
                    
                    <ProgressBar Grid.Column="2" Name="ProgressBarMain" 
                               Value="0" Maximum="100" VerticalAlignment="Center"/>
                </Grid>
            </Border>
        </Grid>
    </Grid>
</Window>